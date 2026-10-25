import { expect, it } from "vitest"
import { fetch } from "./test-server"
import { formatFailureReason } from "../server/utils/health"

type HealthReport = {
    app: string
    database: string
    failureReason: string | null
}

it("reports a ready app and database", async () => {
    const response = await fetch("/api/health")
    expect(response.ok).toBe(true)

    const health = await response.json() as HealthReport
    expect(health.app).toBe("ready")
    expect(health.database).toBe("ready")
    expect(health.failureReason).toBeNull()
})

it("redacts authorization credentials from health failure details", () => {
    const failure = new Error("Database request failed", {
        cause: new Error("Authorization: Bearer access-secret, retrying query"),
    })

    const reason = formatFailureReason(failure)

    expect(reason).toContain("authorization=[redacted]")
    expect(reason).not.toContain("access-secret")
})