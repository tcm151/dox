import type { H3Event } from "h3"

type RateLimitScope = "client" | "account" | "recipient"

interface Route {
    paths: Array<string | RegExp>
    scope?: RateLimitScope
    ms: number
    max: number
}

interface RateLimitRequest {
    key: string
    path: string
    scope?: RateLimitScope
}

export class RateLimiter {
    static #maxRequests = 5
    static #requestWindow = 60_000

    #routes: Route[]
    #buckets: Record<string, { requests: number[], windowMs: number }> = {}
    #interval: ReturnType<typeof setInterval>

    constructor(cleanupWindow: number, routes: Route[]) {
        this.#interval = setInterval(() => this.clearExpired(), cleanupWindow)
        this.#routes = routes
    }

    static createDefault() {
        const requestWindow = RateLimiter.#requestWindow
        const maxRequests = RateLimiter.#maxRequests
        return new RateLimiter(10 * 60 * 1000, [
            { paths: ["/api/user/register"], ms: requestWindow, max: maxRequests },
            { paths: ["/api/profile/login"], ms: requestWindow, max: maxRequests },
            { paths: ["/api/profile/password/reset"], ms: requestWindow, max: maxRequests },
            { paths: ["/api/profile/password/confirm"], ms: requestWindow, max: maxRequests },
            { paths: ["/api/profile/confirm"], ms: requestWindow, max: maxRequests },
            { paths: ["/api/profile/confirm/send"], ms: requestWindow, max: maxRequests },
            { paths: ["/api/profile/confirm/send"], scope: "account", ms: requestWindow, max: 1 },
            { paths: ["/api/profile/confirm/send"], scope: "recipient", ms: 60 * 60 * 1000, max: 3 },
            { paths: ["/api/profile/referral"], ms: requestWindow, max: maxRequests },
            { paths: ["/api/feedback/submit"], ms: requestWindow, max: maxRequests },
            { paths: ["/api/report/send", /^\/api\/(post|gallery|image)\/[^/]+\/report$/], ms: requestWindow, max: maxRequests },
            { paths: ["/api/image/upload"], ms: requestWindow, max: maxRequests },
            { paths: ["/api/audio/upload"], ms: requestWindow, max: maxRequests },
            { paths: ["/api/link/preview"], ms: requestWindow, max: 60 },
        ])
    }

    private clearExpired() {
        const now = Date.now()
        for (const [key, bucket] of Object.entries(this.#buckets)) {
            bucket.requests = bucket.requests.filter(timestamp => timestamp > now - bucket.windowMs)
            if (bucket.requests.length === 0) {
                delete this.#buckets[key]
            }
        }
    }

    private findRoute(path: string, scope: RateLimitScope): { index: number, route: Route } | undefined {
        const index = this.#routes.findIndex(route => route.paths.some(matcher =>
            (route.scope ?? "client") === scope
                && (typeof matcher === "string" ? matcher === path : matcher.test(path)),
        ))
        const route = this.#routes[index]
        return route ? { index, route } : undefined
    }

    enforce(event: H3Event, limits: RateLimitRequest[]) {
        for (const { key, path, scope = "client" } of limits) {
            if (!this.limitExceeded(key, path, scope)) continue

            const retryAfter = this.setRetryAfter(event, [{ key, path, scope }])
            throw createError({
                status: 429,
                statusText: "Too Many Requests. Please try again later.",
                data: { retryAfter }
            })
        }
    }

    setRetryAfter(event: H3Event, limits: RateLimitRequest[]) {
        const retryAfter = Math.max(0, ...limits.map(({ key, path, scope }) =>
            this.retryAfter(key, path, scope),
        ))
        setResponseHeader(event, "Retry-After", retryAfter)
        return retryAfter
    }

    limitExceeded(key: string, path: string, scope: RateLimitScope = "client"): boolean {
        const now = Date.now()
        const match = this.findRoute(path, scope)
        if (!match) return false

        const { index, route } = match
        const bucketKey = `${index}:${scope}:${key}`
        const bucket = this.#buckets[bucketKey] ??= { requests: [], windowMs: route.ms }
        bucket.requests = bucket.requests.filter(timestamp => timestamp > now - route.ms)
        if (bucket.requests.length >= route.max) {
            return true
        }
        bucket.requests.push(now)
        return false
    }

    retryAfter(key: string, path: string, scope: RateLimitScope = "client"): number {
        const match = this.findRoute(path, scope)
        if (!match) return 0

        const { index, route } = match
        const bucket = this.#buckets[`${index}:${scope}:${key}`]
        if (!bucket || bucket.requests.length < route.max) return 0

        const oldest = bucket?.requests.at(0) ?? Date.now()
        return Math.ceil((oldest + route.ms - Date.now()) / 1000)
    }

    destroy() {
        clearInterval(this.#interval)
    }
}

export const rateLimiter = RateLimiter.createDefault()