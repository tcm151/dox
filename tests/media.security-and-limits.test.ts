import { beforeEach, describe, expect, it, vi } from "vitest"

describe("media security and limits", () => {
    beforeEach(() => {
        vi.resetModules()
        vi.unstubAllGlobals()
        vi.stubGlobal("defineEventHandler", (handler: any) => handler)
        vi.stubGlobal("createError", (input: any) => ({ ...input }))
    })

    it("rejects image upload when media setting is disabled", async () => {
        vi.stubGlobal("authenticateRequest", vi.fn().mockResolvedValue({ id: "user:1", tokens: 1000 }))
        vi.stubGlobal("readMultipartFormData", vi.fn().mockResolvedValue([{ data: new Uint8Array([1]), type: "image/png" }]))
        vi.stubGlobal("settingsManager", {
            get: vi.fn().mockResolvedValue({ media: { images: { enabled: false, uploadLimit: 1 } } }),
        })

        const { default: handler } = await import("../server/api/image/upload")
        const result = await handler({ context: {} } as any)
        expect(result).toMatchObject({ status: 503 })
    })

    it("rejects unsupported media type in processor", async () => {
        const { processMedia } = await import("../server/utils/media")
        await expect(processMedia({ type: "text/plain", data: new Uint8Array([120]) } as any)).rejects.toMatchObject({ status: 400 })
    })

    it("rejects upload when user has insufficient tokens", async () => {
        vi.stubGlobal("authenticateRequest", vi.fn().mockResolvedValue({ id: "user:1", tokens: 1 }))
        vi.stubGlobal("readMultipartFormData", vi.fn().mockResolvedValue([{ data: new Uint8Array([1]), type: "image/png" }]))
        vi.stubGlobal("settingsManager", {
            get: vi.fn().mockResolvedValue({ media: { images: { enabled: true, uploadLimit: 1 } } }),
        })
        vi.stubGlobal("processMedia", vi.fn().mockResolvedValue({
            type: "png",
            buffer: { byteLength: 10_000 } as any,
        }))

        const { default: handler } = await import("../server/api/image/upload")
        await expect(handler({ context: {} } as any)).rejects.toMatchObject({ status: 401 })
    })
})
