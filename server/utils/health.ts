type Status = "starting" | "ready" | "failed" | "unknown"

const health = {
    app: "starting" as Status,
    database: "unknown" as Status,
    version: null as string | null,
    failureReason: null as string | null,
    timeStarted: new Date().toISOString(),
    lastChecked: undefined as string | undefined,
}

export function formatFailureReason(error: unknown): string {
    const messages: string[] = []
    const seen = new Set<object>()
    let current: unknown = error

    while (current && messages.length < 5) {
        if (typeof current === "string") {
            messages.push(current)
            break
        }
        if (typeof current !== "object" || seen.has(current)) {
            break
        }

        seen.add(current)
        const failure = current as { message?: unknown, cause?: unknown }
        if (typeof failure.message === "string" && failure.message.trim()) {
            messages.push(failure.message.trim())
        }
        current = failure.cause
    }

    return (messages.join(" Cause: ") || "Unknown failure.")
        .replace(/https?:\/\/\S+/gi, "[redacted URL]")
        .replace(/\bauthorization\b\s*[:=]\s*[^,;\r\n]+/gi, "authorization=[redacted]")
        .replace(/\b(password|passwd|token|secret)\b\s*[:=]\s*[^,\s;]+/gi, "$1=[redacted]")
        .replace(/[\r\n\t]+/g, " ")
        .slice(0, 500)
}

export function useHealth() {
    function setStatus(status: Status) {
        health.app = status
        if (status !== "failed") {
            health.failureReason = null
        }
    }

    function getStatus() {
        return health.app
    }

    function setVersion(version: string | null) {
        health.version = version
    }

    function setFailureReason(error: unknown) {
        health.failureReason = formatFailureReason(error)
    }

    async function healthReport(event: any) {
        health.lastChecked = new Date().toISOString()
        health.database = "unknown"

        if (health.app === "ready") {
            try {
                await new DatabaseQuery().addSql("RETURN true;").execute()
                health.database = "ready"
                health.failureReason = null
            }
            catch (error) {
                health.database = "failed"
                setFailureReason(error)
            }
        }

        if (health.app !== "ready" || health.database !== "ready") {
            setResponseStatus(event, 503)
        }

        return {
            app: health.app,
            database: health.database,
            version: health.version,
            failureReason: health.failureReason,
            timeStarted: health.timeStarted,
            lastChecked: health.lastChecked,
            uptime: process.uptime(),
        }
    }

    return {
        setStatus,
        getStatus,
        setVersion,
        setFailureReason,
        healthReport,
    }
}