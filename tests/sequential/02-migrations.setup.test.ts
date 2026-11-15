import { expect, it } from "vitest"
import type { AppSettings } from "../../shared/types"
import { fetch, grabUser } from "../utils/test-server"

const admin = await grabUser("admin")

it("replays the current migration for an authorized developer", async () => {
    const result = await admin.fetch<{ version: string }>("/api/developer/database/replay", { method: "POST" })
    const healthResponse = await fetch("/api/health")
    const health = await healthResponse.json() as { version: string }
    expect(result.version).toBe(health.version)

    const versions = await admin.query<Array<Array<{ version: string }>>>("SELECT version FROM migration ORDER BY time DESC LIMIT 1;")
    expect(versions[0]?.[0]?.version).toBe(health.version)

    const settings = await admin.fetch<AppSettings>("/api/settings/default")
    expect(settings.email.spool).toEqual({
        dailyLimit: 100,
        batchLimit: 10,
        maxRetries: 3,
    })
    expect(settings.topics).toEqual({
        perSubmission: 3,
        restrict: false,
        allowed: [],
    })
})