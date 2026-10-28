import { randomUUID } from "node:crypto"
import { RateLimiter } from "@@/server/utils/RateLimiter"

const limiter = RateLimiter.createDefault()

export default defineEventHandler(async (event) => {
    const requestId = randomUUID()
    event.context.requestId = requestId
    event.context.requestStartedAt = Date.now()
    setResponseHeader(event, "x-request-id", requestId)

    const path = event.path.split("?").at(0) ?? ""
    const rateLimitPath = RateLimiter.getPath(path)
    const ipAddress = getClientAddress(event)
    const bucketKey = `${rateLimitPath}:${ipAddress}`

    if (limiter.limitExceeded(bucketKey, rateLimitPath)) {
        throw createError({
            status: 429,
            statusText: "Too Many Requests. Please try again later.",
            data: {
                retryAfter: limiter.retryAfter(bucketKey, rateLimitPath)
            }
        })
    }
})