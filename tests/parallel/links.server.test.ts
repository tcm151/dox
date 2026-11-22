import { expect, it, vi } from "vitest"
import { extractId } from "../../shared/utils/records"
import { expectStatus, fetch, grabUser } from "../utils/test-server"
import { RateLimiter } from "../../server/utils/RateLimiter"
import { LinkPreviewManager, UnsafeLinkPreviewTarget } from "../../server/utils/LinkPreviewManager"
import type { LookupAddress } from "node:dns"
import type { Comment, Link, NotificationPage } from "../../shared/types"

const admin = await grabUser("admin")
let topicSequence = 0

const publicAddress: LookupAddress = { address: "93.184.216.34", family: 4 }

function nextTopicId() {
    topicSequence += 1
    return `topic:linktest${Date.now()}${topicSequence}`
}

function linkRequest(topic: string, title = `Link publishing ${Date.now()}`) {
    return {
        title,
        url: "http://127.0.0.1/article",
        topics: [topic],
    }
}

it("creates and retrieves a link and applies topic cooldowns", async () => {
    const topic = nextTopicId()
    const createdIds: string[] = []
    const commentIds: string[] = []
    await admin.query(`CREATE ${topic};`)

    try {
        const response = await admin.fetchRaw<Link>("/api/link/add", {
            method: "POST",
            body: linkRequest(topic),
        })
        expectStatus(response, 200, "create link")

        const link = response._data!
        createdIds.push(extractId(link.id))
        expect(link.id).toMatch(/^link:/)
        expect(link.title).toMatch(/^Link publishing /)
        expect(link.url).toBe("http://127.0.0.1/article")
        expect(link.preview).toEqual({})
        expect(link.topics).toContain(topic)
        expect(link.user).toBe(admin.user.id)

        const fetched = await admin.fetch<Link>(`/api/link/${extractId(link.id)}`)
        expect(fetched.id).toBe(link.id)
        expect(fetched.comments).toEqual([])

        const commentResponse = await admin.fetchRaw<Comment>("/api/comment/add", {
            method: "POST",
            body: { context: link.id, replyTo: link.id, content: `Link comment context ${Date.now()}` },
        })
        expectStatus(commentResponse, 200, "link comment creation")
        const comment = commentResponse._data!
        const commentId = extractId(comment.id)
        commentIds.push(commentId)

        const notifications = await admin.fetch<NotificationPage>(
            "/api/profile/notifications?dismissed=false&pageSize=1000",
        )
        expect(notifications.items.some(notification => notification.context === comment.id)).toBe(true)

        const commentRouteResponse = await admin.fetchRaw(`/comment/${commentId}`, { redirect: "manual" })
        expectStatus(commentRouteResponse, 302, "link comment redirect stage")
        expect(commentRouteResponse.headers.get("location")).toBe(`/link/${extractId(link.id)}#${encodeURIComponent(comment.id)}`)

        const repeated = await admin.fetchRaw<Link>("/api/link/add", {
            method: "POST",
            body: linkRequest(topic),
        })
        if (repeated._data?.id) createdIds.push(extractId(repeated._data.id))
        expectStatus(repeated, 429, "same-topic cooldown")
    }
    finally {
        await admin.query([
            ...commentIds.map(id => `DELETE notification WHERE context = comment:${id}; DELETE comment:${id};`),
            ...createdIds.map(id => `DELETE link:${id};`),
            `DELETE ${topic};`,
        ].join("\n"))
    }
})

it("rejects malformed URLs and links without topics", async () => {
    const invalidUrl = await admin.fetchRaw("/api/link/add", {
        method: "POST",
        body: { ...linkRequest(nextTopicId()), url: "ftp://example.com/article" },
    })
    expectStatus(invalidUrl, 400, "reject unsupported URL protocol")

    const missingTopics = await admin.fetchRaw("/api/link/add", {
        method: "POST",
        body: { ...linkRequest(nextTopicId()), topics: [] },
    })
    expectStatus(missingTopics, 400, "require at least one topic")
})

it("enforces Link title length boundaries", async () => {
    const topics = [nextTopicId(), nextTopicId()]
    const createdIds: string[] = []
    await admin.query(topics.map(topic => `CREATE ${topic};`).join("\n"))

    try {
        for (const [topic, title] of [[topics[0], "Four"], [topics[1], "L".repeat(128)]] as const) {
            const response = await admin.fetchRaw<Link>("/api/link/add", {
                method: "POST",
                body: linkRequest(topic, title),
            })
            if (response._data?.id) createdIds.push(extractId(response._data.id))
            expectStatus(response, 200, `accept title of ${title.length} characters`)
            expect(response._data?.title).toBe(title)
        }

        for (const title of ["abc", "L".repeat(129)]) {
            const response = await admin.fetchRaw("/api/link/add", {
                method: "POST",
                body: linkRequest(nextTopicId(), title),
            })
            expectStatus(response, 400, `reject title of ${title.length} characters`)
        }
    }
    finally {
        await admin.query([
            ...createdIds.map(id => `DELETE link:${id};`),
            ...topics.map(topic => `DELETE ${topic};`),
        ].join("\n"))
    }
})

it("enforces Link title length at the database boundary", async () => {
    const titles = ["Four", "L".repeat(128), "abc", "L".repeat(129)]
    const suffix = Date.now().toString(36)
    const records = titles.map((_, index) => `link:titleBoundary${suffix}${index}`)

    try {
        for (const index of [0, 1]) {
            await admin.query(`CREATE ONLY ${records[index]} SET user = ${admin.user.id}, title = "${titles[index]}", url = "https://example.invalid";`)
        }

        for (const index of [2, 3]) {
            await expect(admin.query(`CREATE ONLY ${records[index]} SET user = ${admin.user.id}, title = "${titles[index]}", url = "https://example.invalid";`)).rejects.toThrow()
        }
    }
    finally {
        await admin.query(`DELETE [${records.join(", ")}];`)
    }
})

it("requires authentication to publish a link", async () => {
    const response = await fetch("/api/link/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(linkRequest(nextTopicId())),
    })

    expectStatus(response, 401)
})

it("allows 60 link preview requests per minute, then blocks the next", () => {
    const limiter = RateLimiter.createDefault()

    try {
        for (let attempt = 0; attempt < 60; attempt++) {
            expect(limiter.limitExceeded("test-client", "/api/link/preview")).toBe(false)
        }

        expect(limiter.limitExceeded("test-client", "/api/link/preview")).toBe(true)
    }
    finally {
        limiter.destroy()
    }
})

it("shares report limits across matching route patterns", () => {
    const limiter = RateLimiter.createDefault()
    const paths = [
        "/api/report/send",
        "/api/post/post-one/report",
        "/api/gallery/gallery-one/report",
        "/api/image/image-one/report",
        "/api/post/post-two/report",
    ]

    try {
        for (const path of paths) {
            expect(limiter.limitExceeded("report-client", path)).toBe(false)
        }

        expect(limiter.limitExceeded("report-client", "/api/image/image-two/report")).toBe(true)
        expect(limiter.limitExceeded("report-client", "/api/comment/comment-one/report")).toBe(false)
    }
    finally {
        limiter.destroy()
    }
})

it("enforces and expires confirmation resend cooldown windows", () => {
    const limiter = RateLimiter.createDefault()
    const now = vi.spyOn(Date, "now").mockReturnValue(1_000_000)

    try {
        const path = "/api/profile/confirm/send"
        expect(limiter.limitExceeded("account", path, "account")).toBe(false)
        expect(limiter.limitExceeded("account", path, "account")).toBe(true)
        expect(limiter.retryAfter("account", path, "account")).toBe(60)

        now.mockReturnValue(1_060_001)
        expect(limiter.limitExceeded("account", path, "account")).toBe(false)

        for (let attempt = 0; attempt < 3; attempt++) {
            expect(limiter.limitExceeded("recipient@example.invalid", path, "recipient")).toBe(false)
        }
        expect(limiter.limitExceeded("recipient@example.invalid", path, "recipient")).toBe(true)
        expect(limiter.retryAfter("recipient@example.invalid", path, "recipient")).toBe(3600)

        now.mockReturnValue(4_660_002)
        expect(limiter.limitExceeded("recipient@example.invalid", path, "recipient")).toBe(false)
    }
    finally {
        limiter.destroy()
        now.mockRestore()
    }
})

it("extracts and normalizes basic HTML preview metadata", async () => {
    const manager = new LinkPreviewManager(
        async () => [publicAddress],
        async () => ({
            statusCode: 200,
            headers: { "content-type": "text/html; charset=utf-8" },
            body: Buffer.from("<title>Fallback title</title><meta property='og:title' content='Example &amp; More'><meta name='description' content='  A   short summary  '>", "utf8"),
        }),
    )

    await expect(manager.get("https://example.test/page#section")).resolves.toEqual({
        title: "Example & More",
        description: "A short summary",
    })
})

it("extracts Schema.org metadata from JSON-LD", async () => {
    const manager = new LinkPreviewManager(
        async () => [publicAddress],
        async () => ({
            statusCode: 200,
            headers: { "content-type": "text/html; charset=utf-8" },
            body: Buffer.from(`<script type="application/ld+json">${JSON.stringify({
                "@context": "https://schema.org",
                "@type": "NewsArticle",
                headline: "  Structured article title  ",
                description: "Structured article description",
                image: { url: "https://images.example.test/article.jpg" },
            })}</script>`),
        }),
    )

    await expect(manager.get("https://example.test/json-ld")).resolves.toEqual({
        title: "Structured article title",
        description: "Structured article description",
        imageUrl: "https://images.example.test/article.jpg",
    })
})

it("extracts Schema.org metadata from HTML microdata", async () => {
    const manager = new LinkPreviewManager(
        async () => [publicAddress],
        async () => ({
            statusCode: 200,
            headers: { "content-type": "text/html; charset=utf-8" },
            body: Buffer.from(`<article itemscope itemtype="https://schema.org/NewsArticle">
                <meta itemprop="headline" content="Microdata article title">
                <meta itemprop="description" content="Microdata article description">
                <img itemprop="image" src="https://images.example.test/microdata.jpg">
            </article>`),
        }),
    )

    await expect(manager.get("https://example.test/microdata")).resolves.toEqual({
        title: "Microdata article title",
        description: "Microdata article description",
        imageUrl: "https://images.example.test/microdata.jpg",
    })
})

it("extracts an Open Graph image relative to the page URL", async () => {
    const manager = new LinkPreviewManager(
        async () => [publicAddress],
        async () => ({
            statusCode: 200,
            headers: { "content-type": "text/html" },
            body: Buffer.from("<link rel='icon' href='/favicon.png'><meta property='og:image' content='/images/preview.jpg'>"),
        }),
    )

    await expect(manager.get("https://example.test/article")).resolves.toEqual({
        imageUrl: "https://example.test/images/preview.jpg",
    })
})

it("uses a declared site logo when no page or oEmbed image is available", async () => {
    const manager = new LinkPreviewManager(
        async () => [publicAddress],
        async () => ({
            statusCode: 200,
            headers: { "content-type": "text/html" },
            body: Buffer.from("<link rel='icon' href='/favicon.png'><link rel='apple-touch-icon' href='/touch-icon.png'>"),
        }),
    )

    await expect(manager.get("https://example.test/article")).resolves.toEqual({
        imageUrl: "https://example.test/touch-icon.png",
    })
})

it("uses an Organization logo from JSON-LD as a final image fallback", async () => {
    const manager = new LinkPreviewManager(
        async () => [publicAddress],
        async () => ({
            statusCode: 200,
            headers: { "content-type": "text/html" },
            body: Buffer.from(`<script type="application/ld+json">${JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Organization",
                logo: "https://example.test/logo.png",
            })}</script>`),
        }),
    )

    await expect(manager.get("https://example.test/article")).resolves.toEqual({
        imageUrl: "https://example.test/logo.png",
    })
})

it("skips unsafe site logos and falls back to the next safe icon", async () => {
    const manager = new LinkPreviewManager(
        async hostname => [hostname === "private.test" ? { address: "10.0.0.1", family: 4 } : publicAddress],
        async () => ({
            statusCode: 200,
            headers: { "content-type": "text/html" },
            body: Buffer.from("<meta property='og:logo' content='https://private.test/logo.png'><link rel='icon' href='/favicon.png'>"),
        }),
    )

    await expect(manager.get("https://example.test/article")).resolves.toEqual({
        imageUrl: "https://example.test/favicon.png",
    })
})

it("omits preview images that resolve to private addresses", async () => {
    const manager = new LinkPreviewManager(
        async hostname => [hostname === "private.test" ? { address: "10.0.0.1", family: 4 } : publicAddress],
        async () => ({
            statusCode: 200,
            headers: { "content-type": "text/html" },
            body: Buffer.from("<meta property='og:image' content='https://private.test/preview.jpg'>"),
        }),
    )

    await expect(manager.get("https://example.test/article")).resolves.toEqual({})
})

it("uses generic YouTube page metadata before oEmbed fills a missing thumbnail", async () => {
    const url = "https://www.youtube.com/watch?v=example"
    const requestPage = vi.fn(async (target: URL) => {
        if (target.pathname !== "/oembed") {
            expect(target.hostname).toBe("www.youtube.com")
            return {
                statusCode: 200,
                headers: { "content-type": "text/html; charset=utf-8" },
                body: Buffer.from("<link rel='icon' href='/favicon.png'><meta property='og:title' content='A YouTube page title'>"),
            }
        }

        expect(target.hostname).toBe("www.youtube.com")
        expect(target.pathname).toBe("/oembed")
        expect(target.searchParams.get("url")).toBe(url)
        return {
            statusCode: 200,
            headers: { "content-type": "application/json; charset=utf-8" },
            body: Buffer.from(JSON.stringify({
                title: "  A YouTube video title  ",
                thumbnail_url: "https://i.ytimg.com/vi/example/hqdefault.jpg",
            })),
        }
    })
    const manager = new LinkPreviewManager(async hostname => {
        expect(["www.youtube.com", "i.ytimg.com"]).toContain(hostname)
        return [publicAddress]
    }, requestPage)

    await expect(manager.get(url)).resolves.toEqual({
        title: "A YouTube page title",
        imageUrl: "https://i.ytimg.com/vi/example/hqdefault.jpg",
    })
    expect(requestPage).toHaveBeenCalledTimes(2)
})

it("extracts YouTube video descriptions from the player response", async () => {
    const description = 'A video description with {braces} and "quoted text". '.repeat(60)
    const expectedDescription = description.trim().slice(0, 256)
    const playerResponse = JSON.stringify({ videoDetails: { shortDescription: description } })
    const requestPage = vi.fn(async (_target: URL, _address: LookupAddress, _timeoutMs: number, maxBytes: number) => {
        expect(maxBytes).toBe(2 * 1024 * 1024)
        return ({
        statusCode: 200,
        headers: { "content-type": "text/html; charset=utf-8" },
        body: Buffer.from([
            "<meta property='og:title' content='A YouTube page title'>",
            "<meta property='og:image' content='https://i.ytimg.com/vi/example/hqdefault.jpg'>",
            " ".repeat(600 * 1024),
            `<script>var ytInitialPlayerResponse = ${playerResponse};</script>`,
        ].join("")),
        })
    })
    const manager = new LinkPreviewManager(async hostname => {
        expect(["www.youtube.com", "i.ytimg.com"]).toContain(hostname)
        return [publicAddress]
    }, requestPage)

    await expect(manager.get("https://www.youtube.com/watch?v=example")).resolves.toEqual({
        title: "A YouTube page title",
        description: expectedDescription,
        imageUrl: "https://i.ytimg.com/vi/example/hqdefault.jpg",
    })
    expect(requestPage).toHaveBeenCalledTimes(1)
})

it("uses generic Reddit page metadata and fills a missing thumbnail from oEmbed", async () => {
    const url = "https://www.reddit.com/r/technology/comments/example/post_title/"
    const requestPage = vi.fn(async (target: URL) => {
        if (target.pathname !== "/oembed") {
            expect(target.href).toBe(url)
            return {
                statusCode: 200,
                headers: { "content-type": "text/html; charset=utf-8" },
                body: Buffer.from("<meta property='og:title' content='A Reddit page title'><meta property='og:description' content='A Reddit post description'>"),
            }
        }

        expect(target.hostname).toBe("www.reddit.com")
        expect(target.pathname).toBe("/oembed")
        expect(target.searchParams.get("url")).toBe(url)
        expect(target.searchParams.get("format")).toBe("json")
        return {
            statusCode: 200,
            headers: { "content-type": "application/json; charset=utf-8" },
            body: Buffer.from(JSON.stringify({
                title: "An oEmbed title that should not replace page metadata",
                thumbnail_url: "https://preview.redd.it/post.jpg",
                html: "<blockquote><script>do not render</script></blockquote>",
            })),
        }
    })
    const manager = new LinkPreviewManager(async hostname => {
        expect(["www.reddit.com", "preview.redd.it"]).toContain(hostname)
        return [publicAddress]
    }, requestPage)

    await expect(manager.get(url)).resolves.toEqual({
        title: "A Reddit page title",
        description: "A Reddit post description",
        imageUrl: "https://preview.redd.it/post.jpg",
    })
    expect(requestPage).toHaveBeenCalledTimes(2)
})

it("replaces a generic Reddit site title with the post title from oEmbed", async () => {
    const url = "https://www.reddit.com/r/technology/comments/example/post_title/"
    const requestPage = vi.fn(async (target: URL) => {
        if (target.pathname !== "/oembed") {
            return {
                statusCode: 200,
                headers: { "content-type": "text/html; charset=utf-8" },
                body: Buffer.from("<meta property='og:title' content='Reddit'><meta name='description' content='A Reddit post description'><meta property='og:image' content='https://images.example.test/post.jpg'>"),
            }
        }

        return {
            statusCode: 200,
            headers: { "content-type": "application/json; charset=utf-8" },
            body: Buffer.from(JSON.stringify({
                title: "A Reddit post title",
                thumbnail_url: "https://preview.redd.it/post.jpg",
            })),
        }
    })
    const manager = new LinkPreviewManager(async () => [publicAddress], requestPage)

    await expect(manager.get(url)).resolves.toEqual({
        title: "A Reddit post title",
        description: "A Reddit post description",
        imageUrl: "https://images.example.test/post.jpg",
    })
    expect(requestPage).toHaveBeenCalledTimes(2)
})

it("does not use Reddit oEmbed when generic page metadata is complete", async () => {
    const requestPage = vi.fn(async () => ({
        statusCode: 200,
        headers: { "content-type": "text/html; charset=utf-8" },
        body: Buffer.from("<meta property='og:title' content='A Reddit title'><meta property='og:description' content='A Reddit description'><meta property='og:image' content='https://preview.redd.it/post.jpg'>"),
    }))
    const manager = new LinkPreviewManager(async () => [publicAddress], requestPage)

    await expect(manager.get("https://www.reddit.com/r/technology/comments/example/post_title/"))
        .resolves.toEqual({
            title: "A Reddit title",
            description: "A Reddit description",
            imageUrl: "https://preview.redd.it/post.jpg",
        })
    expect(requestPage).toHaveBeenCalledTimes(1)
})

it("uses discovered JSON oEmbed metadata without rendering provider HTML", async () => {
    const url = "https://example.test/article"
    const requestPage = vi.fn(async (target: URL) => {
        if (target.hostname === "example.test") {
            return {
                statusCode: 200,
                headers: { "content-type": "text/html; charset=utf-8" },
                body: Buffer.from('<link rel="alternate" type="application/json+oembed" href="https://provider.test/oembed?format=json">'),
            }
        }

        expect(target.hostname).toBe("provider.test")
        expect(target.pathname).toBe("/oembed")
        expect(target.searchParams.get("url")).toBe(url)
        return {
            statusCode: 200,
            headers: { "content-type": "application/json; charset=utf-8" },
            body: Buffer.from(JSON.stringify({
                title: "An oEmbed title",
                thumbnail_url: "https://images.example.test/oembed.jpg",
                html: "<script>must not be rendered</script>",
            })),
        }
    })
    const manager = new LinkPreviewManager(async () => [publicAddress], requestPage)

    await expect(manager.get(url)).resolves.toEqual({
        title: "An oEmbed title",
        imageUrl: "https://images.example.test/oembed.jpg",
    })
    expect(requestPage).toHaveBeenCalledTimes(2)
})

it("rejects discovered oEmbed endpoints that resolve to private addresses", async () => {
    const requestPage = vi.fn(async () => ({
        statusCode: 200,
        headers: { "content-type": "text/html; charset=utf-8" },
        body: Buffer.from('<link rel="alternate" type="application/json+oembed" href="https://private.test/oembed">'),
    }))
    const manager = new LinkPreviewManager(async hostname => [
        hostname === "private.test" ? { address: "10.0.0.1", family: 4 } : publicAddress,
    ], requestPage)

    await expect(manager.get("https://example.test/article"))
        .rejects.toBeInstanceOf(UnsafeLinkPreviewTarget)
    expect(requestPage).toHaveBeenCalledTimes(1)
})

it("rejects private and reserved targets before making a request", async () => {
    const requestPage = vi.fn()
    const manager = new LinkPreviewManager(async () => [
        { address: "93.184.216.34", family: 4 },
        { address: "10.0.0.1", family: 4 },
    ], requestPage)

    await expect(manager.get("https://example.test/"))
        .rejects.toBeInstanceOf(UnsafeLinkPreviewTarget)
    expect(requestPage).not.toHaveBeenCalled()
})

it("revalidates redirect destinations before requesting them", async () => {
    const requestPage = vi.fn(async () => ({
        statusCode: 302,
        headers: { location: "http://private.test/" },
        body: Buffer.alloc(0),
    }))
    const manager = new LinkPreviewManager(async hostname => [
        hostname === "private.test" ? { address: "127.0.0.1", family: 4 } : publicAddress,
    ], requestPage)

    await expect(manager.get("https://example.test/"))
        .rejects.toBeInstanceOf(UnsafeLinkPreviewTarget)
    expect(requestPage).toHaveBeenCalledTimes(1)
})

it("falls back when the page is not HTML, too large, unreachable, or timed out", async () => {
    const responses = [
        { statusCode: 200, headers: { "content-type": "application/json" }, body: Buffer.from("{}") },
        { statusCode: 200, headers: { "content-type": "text/html" }, body: Buffer.alloc(512 * 1024 + 1) },
    ]
    const manager = new LinkPreviewManager(
        async () => [publicAddress],
        async () => {
            const response = responses.shift()
            if (!response) throw new Error("Preview request timed out.")
            return response
        },
    )

    await expect(manager.get("https://example.test/json")).resolves.toEqual({})
    await expect(manager.get("https://example.test/large")).resolves.toEqual({})
    await expect(manager.get("https://example.test/unreachable")).resolves.toEqual({})
})

it("aborts a slow-trickle response at the absolute request deadline", async () => {
    vi.useFakeTimers()
    const chunks: number[] = []
    let aborted = false
    const requestPage = vi.fn(async (_target: URL, _address: LookupAddress, _timeoutMs: number, _maxBytes: number, signal: AbortSignal) => {
        await new Promise<void>((_resolve, reject) => {
            const interval = setInterval(() => chunks.push(chunks.length), 1000)
            signal.addEventListener("abort", () => {
                aborted = true
                clearInterval(interval)
                reject(new Error("Preview request timed out."))
            }, { once: true })
        })
        return { statusCode: 200, headers: { "content-type": "text/html" }, body: Buffer.alloc(0) }
    })
    const manager = new LinkPreviewManager(async () => [publicAddress], requestPage)

    try {
        const result = manager.get("https://example.test/slow-trickle")
        await vi.advanceTimersByTimeAsync(6000)
        await expect(result).resolves.toEqual({})
        expect(chunks.length).toBeGreaterThan(1)
        expect(aborted).toBe(true)
    }
    finally {
        vi.useRealTimers()
    }
})

it("extracts available metadata from malformed HTML", async () => {
    const manager = new LinkPreviewManager(
        async () => [publicAddress],
        async () => ({
            statusCode: 200,
            headers: { "content-type": "text/html" },
            body: Buffer.from("<html><head><title>Incomplete document", "utf8"),
        }),
    )

    await expect(manager.get("https://example.test/malformed")).resolves.toEqual({
        title: "Incomplete document",
    })
})

it("extracts metadata from the bounded prefix of a large HTML page", async () => {
    const body = Buffer.concat([
        Buffer.from("<meta property='og:title' content='A large page title'>"),
        Buffer.alloc(512 * 1024),
    ])
    const manager = new LinkPreviewManager(
        async () => [publicAddress],
        async () => ({
            statusCode: 200,
            headers: { "content-type": "text/html; charset=utf-8", "content-length": String(body.byteLength) },
            body,
        }),
    )

    await expect(manager.get("https://example.test/large-html")).resolves.toEqual({
        title: "A large page title",
    })
})

it("caches preview results and coalesces concurrent requests", async () => {
    const requestPage = vi.fn(async () => ({
        statusCode: 200,
        headers: { "content-type": "text/html" },
        body: Buffer.from("<title>Cached</title>"),
    }))
    const manager = new LinkPreviewManager(async () => [publicAddress], requestPage)

    const [first, concurrent] = await Promise.all([
        manager.get("https://example.test/cache"),
        manager.get("https://example.test/cache"),
    ])
    const cached = await manager.get("https://example.test/cache")

    expect(first).toEqual({ title: "Cached" })
    expect(concurrent).toEqual(first)
    expect(cached).toEqual(first)
    expect(requestPage).toHaveBeenCalledTimes(1)
})

it("requires authentication for preview lookup", async () => {
    const response = await fetch("/api/link/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: "https://example.com" }),
    })

    expectStatus(response, 401)
})

it("rejects private preview targets", async () => {
    const response = await admin.fetchRaw("/api/link/preview", {
        method: "POST",
        body: { url: "http://127.0.0.1/" },
    })

    expectStatus(response, 400)
})