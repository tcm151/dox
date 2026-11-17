import { randomUUID } from "node:crypto"
import { rateLimiter } from "@@/server/utils/RateLimiter"

export default defineEventHandler(async (event) => {
    const requestId = randomUUID()
    event.context.requestId = requestId
    event.context.requestStartedAt = Date.now()
    setResponseHeader(event, "x-request-id", requestId)

    const path = event.path.split("?").at(0) ?? ""
    const ipAddress = getClientAddress(event)
    rateLimiter.enforce(event, [{ key: ipAddress, path }])
})