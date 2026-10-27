import { expect, it } from "vitest"
import { expectStatus, fetch, grabUser } from "../test-server"
import { redactLogData, redactLogText } from "../../server/utils/logRedaction"

const admin = await grabUser("admin")

type LoggedError = {
    id: string
    request: {
        id?: string
        path?: string
        durationMs?: number
        headers: Record<string, unknown>
    }
    data: Record<string, unknown>
}

it("correlates an error response without persisting request secrets", async () => {
    const secret = `request-log-${Date.now()}`
    let requestId: string | null = null

    try {
        const response = await fetch(`/api/not-found?token=${encodeURIComponent(secret)}`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${secret}`,
                Cookie: `session=${secret}`,
                "Content-Type": "application/json",
                "X-Request-ID": "caller-controlled",
                Referer: `https://example.invalid/path?token=${encodeURIComponent(secret)}`,
                "User-Agent": `client Bearer ${secret} /?refresh_token=${secret}`,
            },
            body: JSON.stringify({ password: secret }),
        })
        expectStatus(response, 400)

        requestId = response.headers.get("x-request-id")
        expect(requestId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
        expect(requestId).not.toBe("caller-controlled")

        const errors = await admin.fetch<LoggedError[]>("/api/developer/error?limit=250&codes=400&start=&end=")
        const loggedError = errors.find(error => error.request.id === requestId)

        expect(loggedError).toBeDefined()
        expect(loggedError!.request.path).toBe("/api/not-found")
        expect(loggedError!.request.durationMs).toEqual(expect.any(Number))
        expect(loggedError!.request.headers.authorization).toBeUndefined()
        expect(loggedError!.request.headers.cookie).toBeUndefined()
        expect(JSON.stringify(loggedError)).not.toContain(secret)

        const exactErrors = await admin.fetch<LoggedError[]>(`/api/developer/error?requestId=${encodeURIComponent(requestId)}&limit=1&codes=500&start=2099-01-01&end=2099-01-02`)
        expect(exactErrors).toHaveLength(1)
        expect(exactErrors[0].request.id).toBe(requestId)
    }
    finally {
        if (requestId) {
            await admin.query(`DELETE error WHERE request.id = "${requestId}";`)
        }
    }
})

it("redacts sensitive error-data fields while retaining safe diagnostics", () => {
    expect(redactLogData({
        retryAfter: 30,
        password: "test-password",
        nested: { apiToken: "test-token", status: "rejected" },
    })).toEqual({
        retryAfter: 30,
        password: "[REDACTED]",
        nested: { apiToken: "[REDACTED]", status: "rejected" },
    })

    expect(redactLogData("Bearer hidden-value")).toEqual({ value: "Bearer [REDACTED]" })
    expect(redactLogData(["safe", { token: "hidden-value" }])).toEqual({
        value: ["safe", { token: "[REDACTED]" }],
    })
})

it("redacts credentials and sensitive query parameters in log text", () => {
    expect(redactLogText("Bearer bearer-value Basic Zm9vOmJhcg== /?refresh_token=secret-value&safe=ok"))
        .toBe("Bearer [REDACTED] Basic [REDACTED] /?refresh_token=[REDACTED]&safe=ok")
})