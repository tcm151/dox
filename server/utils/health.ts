type Status = "starting" | "ready" | "failed" | "unknown"

const health = {
    app: "starting" as Status,
    database: "unknown" as Status,
    timeStarted: new Date().toISOString(),
    lastChecked: undefined as string | undefined,
}

export function useHealth() {
    const config = useRuntimeConfig()

    function setAppStatus(status: Status) {
        health.app = status
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
            version: config.public.version,
            timeStarted: health.timeStarted,
            lastChecked: health.lastChecked,
            uptime: process.uptime(),
        }
    }

    return {
        setAppStatus,
        healthReport,
    }
}