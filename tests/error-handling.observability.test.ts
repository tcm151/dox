import { beforeEach, describe, expect, it, vi } from "vitest"

describe("error handling and observability", () => {
    beforeEach(() => {
        vi.resetModules()
        vi.unstubAllGlobals()
    })

    it("server error handler writes structured error records", async () => {
        const addParameter = vi.fn().mockReturnThis()
        const queryOne = vi.fn().mockResolvedValue({ id: "error:1" })

        vi.stubGlobal("defineNitroErrorHandler", (handler: any) => handler)
        vi.stubGlobal("getHeader", (_event: any, key: string) => key)
        vi.stubGlobal("DatabaseQuery", class {
            addSql() { return this }
            addParameter = addParameter
            queryOne = queryOne
        })

        const handler = (await import("../server/plugins/errorHandler")).default
        await handler({ statusCode: 500, statusMessage: "Boom", stack: "trace" }, {
            path: "/api/demo",
            method: "POST",
            context: { account: { user: { id: "user:1" } } },
        })

        expect(addParameter).toHaveBeenCalledWith("status", 500)
        expect(addParameter).toHaveBeenCalledWith("description", "Boom")
        expect(addParameter).toHaveBeenCalledWith("user", "user:1")
        expect(addParameter).toHaveBeenCalledWith("stack", "trace")
        expect(addParameter).toHaveBeenCalledWith("data", {})
        expect(addParameter).toHaveBeenCalledWith("request", expect.objectContaining({
            path: "/api/demo",
            method: "POST",
        }))
        expect(queryOne).toHaveBeenCalled()
    })

    it("client error plugin forwards message to hints", async () => {
        const addError = vi.fn()
        vi.stubGlobal("defineNuxtPlugin", (plugin: any) => plugin)
        vi.stubGlobal("useHints", () => ({ addError }))

        const plugin = (await import("../app/plugins/errorHandler")).default
        const app = { vueApp: { config: {} as any } } as any
        plugin(app)

        app.vueApp.config.errorHandler({ statusText: "Client failure" }, {})
        expect(addError).toHaveBeenCalledWith("Client failure")
    })
})
