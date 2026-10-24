import { expect, it } from "vitest"
import { fetch } from "./test-server"

type HealthReport = {
    app: string
    database: string
}

it("reports a ready app and database", async () => {
    const response = await fetch("/api/health")
    expect(response.ok).toBe(true)

    const health = await response.json() as HealthReport
    expect(health.app).toBe("ready")
    expect(health.database).toBe("ready")
})