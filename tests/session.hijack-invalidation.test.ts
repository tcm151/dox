import { beforeEach, describe, expect, it, vi } from "vitest"

describe("session hijack and invalidation", () => {
    beforeEach(() => {
        vi.resetModules()
        vi.unstubAllGlobals()
        vi.stubGlobal("createError", (input: any) => ({ ...input }))
    })

    it("rejects an access token after logout invalidation", async () => {
        const invalidated = new Set<string>()

        vi.stubGlobal("getHeader", () => "session:abc")
        vi.stubGlobal("SessionManager", {
            authenticateToken: vi.fn().mockImplementation(async (token: string) => {
                if (invalidated.has(token)) {
                    throw new Error("invalidated")
                }
                return { account: { user: { id: "user:1" } } }
            }),
            invalidateToken: vi.fn().mockImplementation(async (token: string) => {
                invalidated.add(token)
            }),
        })

        const { authenticateRequest, invalidateSession } = await import("../server/utils/auth")

        await expect(authenticateRequest({ context: {} } as any)).resolves.toMatchObject({ id: "user:1" })
        await invalidateSession({ context: {} } as any, true)
        await expect(authenticateRequest({ context: {} } as any)).rejects.toMatchObject({ status: 401 })
    })
})
