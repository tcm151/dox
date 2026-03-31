import { beforeEach, describe, expect, it, vi } from "vitest"

describe("auth request protection", () => {
    beforeEach(() => {
        vi.resetModules()
        vi.unstubAllGlobals()
        vi.stubGlobal("getHeader", () => "invalid-token")
        vi.stubGlobal("createError", (input: any) => ({ ...input }))
        vi.stubGlobal("SessionManager", {
            authenticateToken: vi.fn().mockRejectedValue(new Error("invalid session")),
        })
    })

    it("throws 401 for invalid token", async () => {
        const { authenticateRequest } = await import("../server/utils/auth")
        const event = { context: {} } as any

        await expect(authenticateRequest(event)).rejects.toMatchObject({ status: 401 })
    })
})
