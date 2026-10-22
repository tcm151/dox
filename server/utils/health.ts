type Status = "starting" | "ready" | "failed" | "unknown"

const health = {
    app: "starting" as Status,
    database: "unknown" as Status,
    version: null as string | null,
    timeStarted: new Date().toISOString(),
    lastChecked: undefined as string | undefined,
}

export function useHealth() {
    function setStatus(status: Status) {
        health.app = status
    }

    function getStatus() {
        return health.app
    }

    function setVersion(version: string | null) {
        health.version = version
    }

    async function healthReport(event: any) {
        health.lastChecked = new Date().toISOString()
        health.database = "unknown"

        if (health.app === "ready") {
            try {
                await new DatabaseQuery().addSql("RETURN true;").execute()
                health.database = "ready"
            }
            catch {
                health.database = "failed"
            }
        }

        if (health.app !== "ready" || health.database !== "ready") {
            setResponseStatus(event, 503)
        }

        return {
            app: health.app,
            database: health.database,
            version: health.version,
            timeStarted: health.timeStarted,
            lastChecked: health.lastChecked,
            uptime: process.uptime(),
        }
    }

    return {
        setStatus,
        getStatus,
        setVersion,
        healthReport,
    }
}