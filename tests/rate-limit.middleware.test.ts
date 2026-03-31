import { beforeEach, describe, expect, it, vi } from "vitest"

describe("rate-limit middleware", () => {
    beforeEach(() => {
        vi.useFakeTimers()
        vi.resetModules()
        vi.unstubAllGlobals()

        vi.stubGlobal("defineEventHandler", (handler: any) => handler)
        vi.stubGlobal("getRequestIP", () => "127.0.0.1")
        vi.stubGlobal("createError", (input: any) => ({ ...input }))
    })

    it("returns 429 after too many requests to protected route", async () => {
        const { default: middleware } = await import("../server/middleware/protection")
        const event = { path: "/api/user/register", context: {} } as any

        for (let i = 0; i < 5; i++) {
            await middleware(event)
        }

        await expect(middleware(event)).rejects.toMatchObject({ status: 429 })
    })

    it("does not rate-limit unprotected routes", async () => {
        const { default: middleware } = await import("../server/middleware/protection")
        const event = { path: "/api/topic/list", context: {} } as any

        for (let i = 0; i < 10; i++) {
            await expect(middleware(event)).resolves.toBeUndefined()
        }
    })

    it("allows requests again after request window passes", async () => {
        const { default: middleware } = await import("../server/middleware/protection")
        const event = { path: "/api/user/register", context: {} } as any

        for (let i = 0; i < 5; i++) {
            await middleware(event)
        }
        await expect(middleware(event)).rejects.toMatchObject({ status: 429 })

        vi.advanceTimersByTime(60_001)

        for (let i = 0; i < 5; i++) {
            await expect(middleware(event)).resolves.toBeUndefined()
        }
    })
})
