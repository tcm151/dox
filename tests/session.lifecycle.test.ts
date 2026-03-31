import { beforeEach, describe, expect, it, vi } from "vitest"

describe("session lifecycle", () => {
    beforeEach(() => {
        vi.resetModules()
        vi.unstubAllGlobals()
        vi.stubGlobal("createError", (input: any) => ({ ...input }))
    })

    it("authenticateLogin returns access token and user", async () => {
        vi.stubGlobal("getHeader", () => "dGVzdDpzZWNyZXQ=") // test:secret
        vi.stubGlobal("atob", (_value: string) => "test:secret")
        vi.stubGlobal("SessionManager", {
            authenticateLogin: vi.fn().mockResolvedValue({
                id: "session:1",
                account: { user: { id: "user:1", name: "tester" } },
            }),
        })

        const { authenticateLogin } = await import("../server/utils/auth")
        const event = { context: {} } as any

        const result = await authenticateLogin(event)
        expect(result).toMatchObject({ tokens: { access: "session:1" } })
        expect(result.user).toMatchObject({ id: "user:1" })
        expect(event.context.account).toBeDefined()
    })

    it("authenticateRequest resolves user from token", async () => {
        vi.stubGlobal("getHeader", () => "token-1")
        vi.stubGlobal("SessionManager", {
            authenticateToken: vi.fn().mockResolvedValue({
                account: {
                    id: "account:1",
                    user: { id: "user:2", name: "person" },
                },
            }),
        })

        const { authenticateRequest } = await import("../server/utils/auth")
        const event = { context: {} } as any

        const user = await authenticateRequest(event)
        expect(user).toMatchObject({ id: "user:2" })
    })

    it("invalidateSession forwards token when clear is true", async () => {
        const invalidateToken = vi.fn().mockResolvedValue(undefined)
        vi.stubGlobal("getHeader", () => "token-to-clear")
        vi.stubGlobal("SessionManager", { invalidateToken })

        const { invalidateSession } = await import("../server/utils/auth")
        await invalidateSession({ context: {} } as any, true)

        expect(invalidateToken).toHaveBeenCalledWith("token-to-clear")
    })
})
