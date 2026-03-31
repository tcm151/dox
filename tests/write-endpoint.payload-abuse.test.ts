import { beforeEach, describe, expect, it, vi } from "vitest"

describe("write endpoint payload abuse handling", () => {
    beforeEach(() => {
        vi.resetModules()
        vi.unstubAllGlobals()
        vi.stubGlobal("defineEventHandler", (handler: any) => handler)
    })

    it("fails fast on malformed post payload and avoids DB write", async () => {
        const queryOne = vi.fn()

        vi.stubGlobal("authenticateRequest", vi.fn().mockResolvedValue({ id: "user:1" }))
        vi.stubGlobal("readBody", vi.fn().mockRejectedValue(new Error("malformed payload")))
        vi.stubGlobal("DatabaseQuery", class {
            addSql() { return this }
            addRecord() { return this }
            addParameter() { return this }
            addRecords() { return this }
            queryOne = queryOne
        })

        const { default: handler } = await import("../server/api/post/add")

        await expect(handler({ context: {} } as any)).rejects.toThrow("malformed payload")
        expect(queryOne).not.toHaveBeenCalled()
    })

    it("ignores unexpected thread payload fields and maps only supported fields", async () => {
        const addParameter = vi.fn().mockReturnThis()
        const addRecords = vi.fn().mockReturnThis()

        vi.stubGlobal("authenticateRequest", vi.fn().mockResolvedValue({ id: "user:1" }))
        vi.stubGlobal("readBody", vi.fn().mockResolvedValue({
            content: "thread-body",
            topics: ["topic:1"],
            images: [],
            injected: "should-be-ignored",
            role: "admin",
        }))
        vi.stubGlobal("DatabaseQuery", class {
            addSql() { return this }
            addRecord() { return this }
            addParameter = addParameter
            addRecords = addRecords
            queryOne() { return { id: "thread:1" } }
        })

        const { default: handler } = await import("../server/api/thread/add")
        await handler({ context: {} } as any)

        expect(addParameter).toHaveBeenCalledWith("content", "thread-body")
        expect(addRecords).toHaveBeenCalledWith("topics", ["topic:1"])
        expect(addRecords).toHaveBeenCalledWith("images", [])
        expect(addParameter).not.toHaveBeenCalledWith("injected", expect.anything())
        expect(addParameter).not.toHaveBeenCalledWith("role", expect.anything())
    })
})
