export class RateLimiter {
    static #maxRequests = 5
    static #requestWindow = 60_000
    static #reportSubmissionPath = "/api/report-submission"

    #routes: Record<string, { ms: number, max: number }>
    #buckets: Record<string, { requests: number[], windowMs: number }> = {}
    #interval: ReturnType<typeof setInterval>

    constructor(cleanupWindow: number, routes: Record<string, { ms: number, max: number }>) {
        this.#interval = setInterval(() => this.clearExpired(), cleanupWindow)
        this.#routes = routes
    }

    static createDefault() {
        const requestWindow = RateLimiter.#requestWindow
        const maxRequests = RateLimiter.#maxRequests
        return new RateLimiter(10 * 60 * 1000, {
            "/api/user/register": { ms: requestWindow, max: maxRequests },
            "/api/profile/login": { ms: requestWindow, max: maxRequests },
            "/api/profile/password/reset": { ms: requestWindow, max: maxRequests },
            "/api/profile/password/confirm": { ms: requestWindow, max: maxRequests },
            "/api/profile/confirm": { ms: requestWindow, max: maxRequests },
            "/api/profile/referral": { ms: requestWindow, max: maxRequests },
            [RateLimiter.#reportSubmissionPath]: { ms: requestWindow, max: maxRequests },
            "/api/image/upload": { ms: requestWindow, max: maxRequests },
            "/api/audio/upload": { ms: requestWindow, max: maxRequests },
            "/api/link/preview": { ms: requestWindow, max: 60 },
        })
    }

    static getPath(path: string) {
        if (path === "/api/report/send" || /^\/api\/(post|gallery|image)\/[^/]+\/report$/.test(path)) {
            return RateLimiter.#reportSubmissionPath
        }

        return path
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

    limitExceeded(key: string, path: string): boolean {
        const now = Date.now()
        const route = this.#routes[path]
        if (!route) {
            return false
        }

        const bucket = this.#buckets[key] ??= { requests: [], windowMs: route.ms }
        bucket.requests = bucket.requests.filter(timestamp => timestamp > now - route.ms)
        if (bucket.requests.length >= route.max) {
            return true
        }
        bucket.requests.push(now)
        return false
    }

    retryAfter(key: string, path: string): number {
        const { ms } = this.#routes[path] ?? { ms: 0 }
        const oldest = this.#buckets[key]?.requests.at(0) ?? Date.now()
        return Math.ceil((oldest + ms - Date.now()) / 1000)
    }

    destroy() {
        clearInterval(this.#interval)
    }
}