class RateLimiter {
    #routes: Record<string, { ms: number, max: number }>
    #buckets: Record<string, { requests: number[], windowMs: number }> = {}
    #interval: ReturnType<typeof setInterval>

    constructor(cleanupWindow: number, routes: Record<string, { ms: number, max: number }>) {
        this.#interval = setInterval(() => this.clearExpired(), cleanupWindow)
        this.#routes = routes
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

const MAX_REQUESTS = 5
const REQUEST_WINDOW = 60_000 // 1 minute

// Clean up every 10 minutes
const limiter = new RateLimiter(10 * 60 * 1000, {
    "/api/user/register": { ms: REQUEST_WINDOW, max: MAX_REQUESTS },
    "/api/profile/login": { ms: REQUEST_WINDOW, max: MAX_REQUESTS },
    "/api/profile/password/reset": { ms: REQUEST_WINDOW, max: MAX_REQUESTS },
    "/api/profile/password/confirm": { ms: REQUEST_WINDOW, max: MAX_REQUESTS },
    "/api/profile/confirm": { ms: REQUEST_WINDOW, max: MAX_REQUESTS },
    "/api/profile/referral": { ms: REQUEST_WINDOW, max: MAX_REQUESTS },
    "/api/report/send": { ms: REQUEST_WINDOW, max: MAX_REQUESTS },
    "/api/image/upload": { ms: REQUEST_WINDOW, max: MAX_REQUESTS },
    "/api/audio/upload": { ms: REQUEST_WINDOW, max: MAX_REQUESTS },
}) 

export default defineEventHandler(async (event) => {
    const path = event.path.split("?").at(0) ?? ""
    const ipAddress = getClientAddress(event)
    const bucketKey = `${path}:${ipAddress}`

    if (limiter.limitExceeded(bucketKey, path)) {
        throw createError({
            status: 429,
            statusText: "Too Many Requests. Please try again later.",
            data: {
                retryAfter: limiter.retryAfter(bucketKey, path)
            }
        })
    }
})