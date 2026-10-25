import { expect, it } from "vitest"
import { fetch, grabUser } from "../test-server"

const admin = await grabUser("admin")

it("replays the current migration for an authorized developer", async () => {
    const response = await fetch("/api/developer/database/replay", {
        method: "POST",
        headers: { Authorization: admin.accessToken },
    })
    expect(response.status, await response.clone().text()).toBe(200)

    const result = await response.json() as { version: string }
    const healthResponse = await fetch("/api/health")
    const health = await healthResponse.json() as { version: string }
    expect(result.version).toBe(health.version)

    const versionResponse = await fetch("/api/developer/database/query", {
        method: "POST",
        headers: {
            Authorization: admin.accessToken,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: "SELECT version FROM migration ORDER BY time DESC LIMIT 1;" }),
    })
    expect(versionResponse.status, await versionResponse.clone().text()).toBe(200)

    const versions = await versionResponse.json() as Array<Array<{ version: string }>>
    expect(versions[0]?.[0]?.version).toBe(health.version)
})