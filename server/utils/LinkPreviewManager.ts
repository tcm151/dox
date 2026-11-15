import { lookup as dnsLookup } from "node:dns/promises"
import type { LookupAddress } from "node:dns"
import { request as httpRequest } from "node:http"
import type { IncomingHttpHeaders } from "node:http"
import { request as httpsRequest } from "node:https"
import { isIP } from "node:net"
import ipaddr from "ipaddr.js"
import { parse } from "parse5"
import type { Link } from "@@/shared/types"

const maxRedirects = 3
const maxResponseBytes = 512 * 1024
const maxYouTubeResponseBytes = 2 * 1024 * 1024
const maxDescriptionLength = 256
const requestTimeoutMs = 5_000
const cacheDurationMs = 10 * 60 * 1000
const maxCacheEntries = 256
const redirectStatuses = new Set([301, 302, 303, 307, 308])
const htmlContentTypes = new Set(["text/html", "application/xhtml+xml"])

type PreviewResponse = {
    statusCode: number
    headers: IncomingHttpHeaders
    body: Buffer
}

type AddressResolver = (hostname: string) => Promise<LookupAddress[]>
type PageRequester = (url: URL, address: LookupAddress, timeoutMs: number, maxBytes: number, signal: AbortSignal) => Promise<PreviewResponse>

interface HtmlNode {
    tagName?: string
    attrs?: { name: string, value: string }[]
    childNodes?: HtmlNode[]
    value?: string
}

type CachedPreview = {
    expiresAt: number
    value: Link["preview"]
}

type HtmlMetadata = {
    preview: Link["preview"]
    image?: string
    iconUrls: string[]
    oEmbedTarget?: URL
    youtubeDescription?: string
}

export class UnsafeLinkPreviewTarget extends Error {}

export class LinkPreviewManager {
    #cache = new Map<string, CachedPreview>()
    #pending = new Map<string, Promise<Link["preview"]>>()

    constructor(
        private readonly resolveAddresses: AddressResolver = resolveHostname,
        private readonly requestPage: PageRequester = makeRequest,
    ) {}

    get(url: string): Promise<Link["preview"]> {
        const target = parseTarget(url)
        const key = target.href
        const cached = this.#cache.get(key)
        if (cached && cached.expiresAt > Date.now()) return Promise.resolve({ ...cached.value })
        if (cached) this.#cache.delete(key)

        const pending = this.#pending.get(key)
        if (pending) return pending

        const request = this.loadPreview(target)
            .catch((error: unknown): Link["preview"] => {
                if (error instanceof UnsafeLinkPreviewTarget) throw error
                return {}
            })
            .then((preview) => {
                this.cache(key, preview)
                return preview
            })
            .finally(() => this.#pending.delete(key))

        this.#pending.set(key, request)
        return request
    }

    private async loadPreview(initialTarget: URL): Promise<Link["preview"]> {
        const deadline = Date.now() + requestTimeoutMs
        const platformOEmbedTarget = getPlatformOEmbedTarget(initialTarget)
        const oEmbedTargets = new Map<string, URL>()
        let metadataPageUrl = initialTarget
        let iconUrls: string[] = []
        let preview: Link["preview"] = {}

        const result = await this.requestTarget(initialTarget, deadline)
        if (result) {
            metadataPageUrl = result.target
            if (isHtmlResponse(result.response)) {
                const byteLimit = isYouTubeTarget(result.target) ? maxYouTubeResponseBytes : maxResponseBytes
                const html = result.response.body.subarray(0, byteLimit).toString("utf8")
                const metadata = extractHtmlMetadata(html, result.target, initialTarget)
                iconUrls = metadata.iconUrls
                preview = metadata.preview
                const imageUrl = await safeImageUrl(metadata.image, result.target, this.resolveAddresses, remainingTime(deadline))
                if (imageUrl) preview.imageUrl = imageUrl

                if (metadata.youtubeDescription) {
                    preview.description = normalizeText(metadata.youtubeDescription, maxDescriptionLength)
                }
                if (needsOEmbedFallback(preview, initialTarget) && metadata.oEmbedTarget) {
                    oEmbedTargets.set(metadata.oEmbedTarget.href, metadata.oEmbedTarget)
                }
            }
        }

        if (needsOEmbedFallback(preview, initialTarget) && platformOEmbedTarget) {
            oEmbedTargets.set(platformOEmbedTarget.href, platformOEmbedTarget)
        }

        for (const target of oEmbedTargets.values()) {
            const oEmbedPreview = await this.loadOEmbedPreview(target, deadline)
            const genericPageTitle = isGenericSiteTitle(preview.title, initialTarget)
            preview = { ...oEmbedPreview, ...preview }
            if (genericPageTitle && oEmbedPreview.title) preview.title = oEmbedPreview.title
            if (preview.title && preview.imageUrl) break
        }

        if (!preview.imageUrl) {
            for (const iconUrl of iconUrls) {
                const imageUrl = await safeImageUrl(iconUrl, metadataPageUrl, this.resolveAddresses, remainingTime(deadline))
                if (!imageUrl) continue
                preview.imageUrl = imageUrl
                break
            }
        }

        return preview
    }

    private async loadOEmbedPreview(target: URL, deadline: number): Promise<Link["preview"]> {
        const result = await this.requestTarget(target, deadline)
        if (!result || !isJsonResponse(result.response)) return {}

        try {
            return await extractOEmbedMetadata(
                result.response.body.toString("utf8"),
                result.target,
                this.resolveAddresses,
                remainingTime(deadline),
            )
        }
        catch {
            return {}
        }
    }

    private async requestTarget(initialTarget: URL, deadline: number): Promise<{ target: URL, response: PreviewResponse } | undefined> {
        let target = initialTarget

        for (let redirectCount = 0; redirectCount <= maxRedirects; redirectCount++) {
            const timeoutMs = deadline - Date.now()
            if (timeoutMs <= 0) return

            let addresses: LookupAddress[]
            try {
                addresses = await withTimeout(this.resolveAddresses(normalizeHostname(target.hostname)), timeoutMs)
            }
            catch {
                return
            }

            const address = addresses[0]
            if (!address) return
            if (addresses.some(address => !isPublicAddress(address.address))) {
                throw new UnsafeLinkPreviewTarget("The preview URL resolves to a private or reserved address.")
            }

            const controller = new AbortController()
            const maxBytes = isYouTubeTarget(target) ? maxYouTubeResponseBytes : maxResponseBytes
            let response: PreviewResponse
            try {
                response = await withTimeout(
                    this.requestPage(target, address, timeoutMs, maxBytes, controller.signal),
                    timeoutMs,
                    "Preview request timed out.",
                    () => controller.abort(),
                )
            }
            catch {
                return
            }

            if (!redirectStatuses.has(response.statusCode)) return { target, response }
            if (redirectCount === maxRedirects) return

            const location = firstHeader(response.headers.location)
            if (!location) return
            target = parseTarget(location, target)
        }
    }

    private cache(key: string, value: Link["preview"]) {
        if (this.#cache.size >= maxCacheEntries) {
            const oldestKey = this.#cache.keys().next().value
            if (oldestKey) this.#cache.delete(oldestKey)
        }

        this.#cache.set(key, { value, expiresAt: Date.now() + cacheDurationMs })
    }
}

export const linkPreviewManager = new LinkPreviewManager()

function parseTarget(value: string | URL, base?: URL): URL {
    let target: URL
    try {
        target = new URL(value, base)
    }
    catch {
        throw new UnsafeLinkPreviewTarget("The preview URL is invalid.")
    }

    if (!(target.protocol === "http:" || target.protocol === "https:") || target.username || target.password || target.port) {
        throw new UnsafeLinkPreviewTarget("Only public HTTP and HTTPS URLs on their default ports can be previewed.")
    }

    target.hash = ""
    return target
}

function normalizeHostname(hostname: string) {
    return hostname.replace(/^\[|\]$/g, "")
}

async function resolveHostname(hostname: string): Promise<LookupAddress[]> {
    const family = isIP(hostname)
    if (family) return [{ address: hostname, family }]
    return await dnsLookup(hostname, { all: true, verbatim: true })
}

function isPublicAddress(address: string) {
    try {
        return ipaddr.process(address).range() === "unicast"
    }
    catch {
        return false
    }
}

function isYouTubeTarget(target: URL) {
    const hostname = target.hostname.toLowerCase()
    return hostname === "youtu.be" || hostname === "youtube.com" || hostname.endsWith(".youtube.com")
}

function getPlatformOEmbedTarget(target: URL): URL | undefined {
    const hostname = target.hostname.toLowerCase()
    const isRedditPost = ["reddit.com", "www.reddit.com", "old.reddit.com"].includes(hostname)
        && /\/comments\/[a-z0-9]+(?:\/|$)/i.test(target.pathname)
    const endpoint = isYouTubeTarget(target)
        ? "https://www.youtube.com/oembed"
        : isRedditPost
            ? "https://www.reddit.com/oembed"
            : undefined
    if (!endpoint) return

    const oEmbedTarget = new URL(endpoint)
    oEmbedTarget.searchParams.set("url", target.href)
    oEmbedTarget.searchParams.set("format", "json")
    return oEmbedTarget
}

function extractHtmlMetadata(html: string, pageUrl: URL, contentUrl: URL): HtmlMetadata {
    const elements = findElements(parse(html) as unknown as HtmlNode)
    const structured = getJsonLdMetadata(elements)
    const title = getMeta(elements, "property", "og:title")
        ?? getMeta(elements, "name", "twitter:title")
        ?? structured.title
        ?? getItemprop(elements, ["headline", "name"])
        ?? elements.filter(element => element.tagName === "title").map(textContent).find(Boolean)
    const description = getMeta(elements, "name", "description")
        ?? getMeta(elements, "property", "og:description")
        ?? getMeta(elements, "name", "twitter:description")
        ?? structured.description
        ?? getItemprop(elements, ["description"])
    const image = getMeta(elements, "property", "og:image:secure_url")
        ?? getMeta(elements, "property", "og:image")
        ?? getMeta(elements, "name", "twitter:image")
        ?? getMeta(elements, "name", "twitter:image:src")
        ?? structured.image
        ?? getItemprop(elements, ["image"])

    const preview: Link["preview"] = {}
    const normalizedTitle = normalizeText(title, 512)
    const normalizedDescription = normalizeText(description, maxDescriptionLength)
    if (normalizedTitle) preview.title = normalizedTitle
    if (normalizedDescription) preview.description = normalizedDescription

    return {
        preview,
        image,
        iconUrls: getSiteIconUrls(elements, structured.logo),
        oEmbedTarget: getDiscoveredOEmbedTarget(elements, pageUrl, contentUrl),
        youtubeDescription: getYouTubeVideoDescription(elements, pageUrl),
    }
}

function getDiscoveredOEmbedTarget(elements: HtmlNode[], pageUrl: URL, contentUrl: URL): URL | undefined {
    for (const element of elements) {
        if (element.tagName !== "link") continue

        const relations = getAttribute(element, "rel")?.toLowerCase().split(/\s+/)
        const type = getAttribute(element, "type")?.split(";", 1)[0]?.trim().toLowerCase()
        const href = getAttribute(element, "href")
        if (!relations?.includes("alternate") || type !== "application/json+oembed" || !href) continue

        try {
            const target = parseTarget(href, pageUrl)
            target.searchParams.set("url", contentUrl.href)
            target.searchParams.set("format", "json")
            return target
        }
        catch {
            continue
        }
    }
}

function getYouTubeVideoDescription(elements: HtmlNode[], target: URL) {
    if (!isYouTubeTarget(target)) return

    for (const element of elements) {
        if (element.tagName !== "script") continue

        const script = textContent(element)
        const assignment = /\bytInitialPlayerResponse\s*=\s*/.exec(script)
        if (!assignment) continue

        const json = extractJsonObject(script, assignment.index + assignment[0].length)
        if (!json) continue

        try {
            const response: unknown = JSON.parse(json)
            if (!response || typeof response !== "object" || !("videoDetails" in response)) continue

            const videoDetails = response.videoDetails
            if (!videoDetails || typeof videoDetails !== "object" || !("shortDescription" in videoDetails)) continue

            const description = videoDetails.shortDescription
            if (typeof description === "string" && description.trim()) return description
        }
        catch {
            continue
        }
    }
}

function extractJsonObject(source: string, startIndex: number) {
    const objectStart = source.indexOf("{", startIndex)
    if (objectStart < 0) return

    let depth = 0
    let insideString = false
    let escaped = false
    for (let index = objectStart; index < source.length; index++) {
        const character = source[index]
        if (insideString) {
            if (escaped) escaped = false
            else if (character === "\\") escaped = true
            else if (character === '"') insideString = false
            continue
        }

        if (character === '"') insideString = true
        else if (character === "{") depth++
        else if (character === "}" && --depth === 0) return source.slice(objectStart, index + 1)
    }
}

function needsOEmbedFallback(preview: Link["preview"], target: URL) {
    return !preview.title || !preview.imageUrl || isGenericSiteTitle(preview.title, target)
}

function isGenericSiteTitle(title: string | undefined, target: URL) {
    if (!title) return false
    const siteName = target.hostname.toLowerCase().replace(/^www\./, "").split(".")[0]
    const normalizedTitle = title.toLowerCase().replace(/[^a-z0-9]/g, "")
    return normalizedTitle === siteName
}

function isHtmlResponse(response: PreviewResponse) {
    if (response.statusCode !== 200 || !isIdentityEncoded(response.headers)) return false
    const contentType = getContentType(response.headers)
    return contentType !== undefined && htmlContentTypes.has(contentType)
}

function isJsonResponse(response: PreviewResponse) {
    return response.statusCode === 200
        && isIdentityEncoded(response.headers)
        && getContentType(response.headers) === "application/json"
        && response.body.byteLength <= maxResponseBytes
}

function isIdentityEncoded(headers: IncomingHttpHeaders) {
    const encoding = firstHeader(headers["content-encoding"])
    return !encoding || encoding.toLowerCase() === "identity"
}

function getContentType(headers: IncomingHttpHeaders) {
    return firstHeader(headers["content-type"])?.split(";", 1)[0]?.trim().toLowerCase()
}

function getSiteIconUrls(elements: HtmlNode[], structuredLogo?: string): string[] {
    const getLinksFor = (relations: string[]) => elements
        .filter(element => element.tagName === "link" && relations.some(relation => getAttribute(element, "rel")?.toLowerCase().split(/\s+/).includes(relation)))
        .map(element => getAttribute(element, "href"))

    const candidates = [
        getMeta(elements, "property", "og:logo"),
        getItemprop(elements, ["logo"]),
        structuredLogo,
        ...getLinksFor(["apple-touch-icon", "apple-touch-icon-precomposed"]),
        ...getLinksFor(["icon"]),
    ]
    return [...new Set(candidates.filter((candidate): candidate is string => Boolean(candidate)))]
}

function getJsonLdMetadata(elements: HtmlNode[]) {
    const metadata: { title?: string, description?: string, image?: string, logo?: string } = {}

    for (const element of elements) {
        if (element.tagName !== "script") continue
        const type = getAttribute(element, "type")?.split(";", 1)[0]?.trim().toLowerCase()
        if (type !== "application/ld+json") continue

        let data: unknown
        try {
            data = JSON.parse(textContent(element))
        }
        catch {
            continue
        }

        const pending = [data]
        while (pending.length) {
            const current = pending.pop()
            if (Array.isArray(current)) {
                for (let index = current.length - 1; index >= 0; index--) pending.push(current[index])
                continue
            }
            if (!current || typeof current !== "object") continue

            const record = current as Record<string, unknown>
            metadata.title ??= getString(record.headline) ?? getString(record.name)
            metadata.description ??= getString(record.description)
            metadata.image ??= getSchemaImage(record.image)
            metadata.logo ??= getSchemaImage(record.logo)

            for (const key of ["mainEntityOfPage", "mainEntity", "@graph"]) {
                const nested = record[key]
                if (nested !== undefined) pending.push(nested)
            }
        }
    }

    return metadata
}

function getSchemaImage(value: unknown): string | undefined {
    if (typeof value === "string") return value
    if (Array.isArray(value)) return value.map(getSchemaImage).find(Boolean)
    if (!value || typeof value !== "object") return

    const record = value as Record<string, unknown>
    return getSchemaImage(record.url) ?? getSchemaImage(record.contentUrl)
}

function getString(value: unknown) {
    return typeof value === "string" && value.trim() ? value : undefined
}

function getItemprop(elements: HtmlNode[], expectedValues: string[]) {
    for (const element of elements) {
        const itemprops = getAttribute(element, "itemprop")?.toLowerCase().split(/\s+/)
        if (!itemprops?.some(itemprop => expectedValues.includes(itemprop))) continue

        const value = getAttribute(element, "content")
            ?? getAttribute(element, "href")
            ?? getAttribute(element, "src")
            ?? textContent(element)
        if (value?.trim()) return value
    }
}

async function extractOEmbedMetadata(json: string, pageUrl: URL, resolveAddresses: AddressResolver, timeoutMs: number): Promise<Link["preview"]> {
    const data: unknown = JSON.parse(json)
    if (!data || typeof data !== "object") return {}

    const title = normalizeText(getString("title" in data ? data.title : undefined), 512)
    const thumbnailUrl = getString("thumbnail_url" in data ? data.thumbnail_url : undefined)
    const imageUrl = await safeImageUrl(thumbnailUrl, pageUrl, resolveAddresses, timeoutMs)
    return { ...(title && { title }), ...(imageUrl && { imageUrl }) }
}

function findElements(root: HtmlNode): HtmlNode[] {
    return [...walkHtml(root)].filter(node => node.tagName)
}

function getMeta(elements: HtmlNode[], key: string, expectedValue: string) {
    for (const element of elements) {
        if (element.tagName !== "meta") continue
        const keyValue = getAttribute(element, key)?.toLowerCase()
        if (keyValue === expectedValue) return getAttribute(element, "content")
    }
}

function getAttribute(element: HtmlNode, name: string) {
    return element.attrs?.find(attribute => attribute.name.toLowerCase() === name)?.value
}

function* walkHtml(root: HtmlNode): Generator<HtmlNode> {
    const pending = [root]

    while (pending.length) {
        const node = pending.pop()!
        yield node
        if (node.value !== undefined) continue

        const children = node.childNodes ?? []
        for (let index = children.length - 1; index >= 0; index--) {
            const child = children[index]
            if (child) pending.push(child)
        }
    }
}

function textContent(root: HtmlNode): string {
    return [...walkHtml(root)].map(node => node.value ?? "").join("")
}

async function safeImageUrl(value: string | undefined, base: URL, resolveAddresses: AddressResolver, timeoutMs: number) {
    if (!value || value.length > 2048) return

    let imageUrl: URL
    try {
        imageUrl = new URL(value, base)
    }
    catch {
        return
    }

    if (imageUrl.protocol !== "https:" || imageUrl.username || imageUrl.password || imageUrl.port) return

    let addresses: LookupAddress[]
    try {
        addresses = await withTimeout(resolveAddresses(normalizeHostname(imageUrl.hostname)), timeoutMs)
    }
    catch {
        return
    }

    if (!addresses.length || addresses.some(address => !isPublicAddress(address.address))) return
    return imageUrl.href
}

function makeRequest(target: URL, address: LookupAddress, timeoutMs: number, maxBytes: number, signal: AbortSignal): Promise<PreviewResponse> {
    const hostname = normalizeHostname(target.hostname)
    const options = {
        hostname,
        port: target.port ? Number(target.port) : undefined,
        path: `${target.pathname}${target.search}`,
        method: "GET",
        headers: {
            "user-agent": "ClassicForumLinkPreview/1.0",
            "accept": "text/html,application/xhtml+xml,application/json",
            "accept-encoding": "identity",
        },
        family: address.family,
        lookup: (_hostname: string, _options: unknown, callback: (error: NodeJS.ErrnoException | null, address: string, family: number) => void) => {
            callback(null, address.address, address.family)
        },
        agent: false,
    }

    return new Promise((resolve, reject) => {
        const receiveResponse = (response: import("node:http").IncomingMessage) => {
            const statusCode = response.statusCode ?? 0
            if (redirectStatuses.has(statusCode)) {
                const headers = response.headers
                response.destroy()
                resolve({ statusCode, headers, body: Buffer.alloc(0) })
                return
            }

            const isHtml = htmlContentTypes.has(getContentType(response.headers) ?? "")
            const declaredLength = Number(response.headers["content-length"])
            if (!isHtml && Number.isFinite(declaredLength) && declaredLength > maxBytes) {
                response.destroy()
                reject(new Error("Preview response exceeds the size limit."))
                return
            }

            const chunks: Buffer[] = []
            let totalBytes = 0
            response.on("data", (chunk: Buffer | string) => {
                const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
                const remainingBytes = maxBytes - totalBytes
                if (buffer.byteLength > remainingBytes) {
                    if (isHtml) {
                        if (remainingBytes > 0) chunks.push(buffer.subarray(0, remainingBytes))
                        resolve({ statusCode, headers: response.headers, body: Buffer.concat(chunks) })
                        response.destroy()
                        return
                    }
                    response.destroy()
                    reject(new Error("Preview response exceeds the size limit."))
                    return
                }

                totalBytes += buffer.byteLength
                chunks.push(buffer)
            })
            response.on("end", () => resolve({ statusCode, headers: response.headers, body: Buffer.concat(chunks) }))
            response.on("error", reject)
        }

        const request = target.protocol === "https:"
            ? httpsRequest({ ...options, servername: isIP(hostname) ? undefined : hostname }, receiveResponse)
            : httpRequest(options, receiveResponse)
        const abortRequest = () => request.destroy(new Error("Preview request timed out."))

        if (signal.aborted) abortRequest()
        else signal.addEventListener("abort", abortRequest, { once: true })
        request.on("close", () => signal.removeEventListener("abort", abortRequest))
        request.setTimeout(timeoutMs, () => request.destroy(new Error("Preview request timed out.")))
        request.on("error", reject)
        request.end()
    })
}

function remainingTime(deadline: number) {
    return Math.max(1, deadline - Date.now())
}

function normalizeText(value: string | undefined, maxLength: number) {
    const text = value?.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").replace(/\s+/g, " ").trim().slice(0, maxLength)
    return text || undefined
}

function firstHeader(value: string | string[] | undefined) {
    return Array.isArray(value) ? value[0] : value
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message = "Preview operation timed out.", onTimeout?: () => void): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined
    const timeout = new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => {
            onTimeout?.()
            reject(new Error(message))
        }, timeoutMs)
    })

    return Promise.race([promise, timeout]).finally(() => {
        if (timer) clearTimeout(timer)
    })
}
