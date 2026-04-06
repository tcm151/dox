class RateLimiter {
    #routes: Record<string, { ms: number, max: number }>
    #buckets: Record<string, number[]> = {}
    #interval: ReturnType<typeof setInterval>

    constructor(cleanupWindow: number, routes: Record<string, { ms: number, max: number }>) {
        this.#interval = setInterval(() => this.clearExpired(), cleanupWindow)
        this.#routes = routes
    }

    private clearExpired() {
        for (const ip of Object.keys(this.#buckets)) {
            if (this.#buckets[ip]?.length === 0) {
                delete this.#buckets[ip]
            }
        }
    }

    limitExceeded(key: string, path: string): boolean {
        const now = Date.now()
        const bucket = this.#buckets[key] ?? []
        if (this.#routes[path]) {
            const { ms, max } = this.#routes[path]
            this.#buckets[key] = bucket.filter(t => t > now - ms)
            if (this.#buckets[key].length >= max) {
                return true
            }
            this.#buckets[key].push(now)
        }
        return false
    }

    retryAfter(key: string, path: string): number {
        const { ms } = this.#routes[path] ?? { ms: 0 }
        const oldest = this.#buckets[key]?.at(0) ?? Date.now()
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
}) 

export default defineEventHandler(async (event) => {
    const path = event.path.split("?").at(0) ?? ""
    const ipAddress = getRequestIP(event, { xForwardedFor: false }) ?? "unknown"
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