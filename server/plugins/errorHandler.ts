import { randomUUID } from "node:crypto"
import { redactLogData, redactLogText } from "@@/server/utils/logRedaction"

function safeOrigin(value?: string) {
    if (!value) return undefined

    try {
        return new URL(value).origin
    }
    catch {
        return undefined
    }
}

function safeHost(value?: string) {
    if (!value) return undefined

    try {
        return new URL(`http://${value}`).host
    }
    catch {
        return undefined
    }
}

export default defineNitroErrorHandler(async (error, event) => {
    if (error.statusCode) {
        const requestId = typeof event.context.requestId === "string"
            ? event.context.requestId
            : randomUUID()
        const startedAt = typeof event.context.requestStartedAt === "number"
            ? event.context.requestStartedAt
            : Date.now()
        setResponseHeader(event, "x-request-id", requestId)

        try {
            const safeData = redactLogData(error.data ?? {})
            await new DatabaseQuery()
                .addSql(`
                    CREATE error SET
                        status = $status,
                        description = $description,
                        request = $request,
                        user = $user,
                        stack = $stack,
                        data = $data;
                `)
                .addParameter("status", error.statusCode)
                .addParameter("description", redactLogText(error.statusMessage ?? error.message ?? ""))
                .addParameter("request", {
                    id: requestId,
                    path: getRequestURL(event).pathname,
                    method: event.method,
                    durationMs: Math.max(0, Date.now() - startedAt),
                    headers: {
                        ip: getClientAddress(event),
                        origin: safeOrigin(getHeader(event, "origin")),
                        host: safeHost(getHeader(event, "host")),
                        refererOrigin: safeOrigin(getHeader(event, "referer")),
                        userAgent: redactLogText(getHeader(event, "user-agent") ?? ""),
                    }
                })
                .addParameter("user", event.context.account?.user.id ?? "unknown")
                .addParameter("stack", redactLogText(error.stack ?? ""))
                .addParameter("data", safeData)
                .queryOne<Error>()
        }
        catch (error: any) {
            console.error("Failed to persist request error", {
                requestId,
                message: redactLogText(error?.message ?? String(error)),
            })
        }
    }
})