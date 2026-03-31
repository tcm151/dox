// @vitest-environment nuxt

import { mockNuxtImport } from "@nuxt/test-utils/runtime"
import { createPinia, setActivePinia } from "pinia"
import { ref } from "vue"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useSettings } from "../app/utils/settings"

const useApiMock = vi.hoisted(() => vi.fn())
const useCacheMock = () => ({
    get: <T>(_: string, fallback: () => T) => ref(fallback()),
})

mockNuxtImport("useCache", () => useCacheMock)

describe("settings corruption resilience", () => {
    beforeEach(() => {
        setActivePinia(createPinia())
        vi.resetAllMocks()
        vi.stubGlobal("useApi", useApiMock)
    })

    it("keeps safe defaults when settings refresh fails", async () => {
        useApiMock.mockRejectedValueOnce(new Error("settings backend unavailable"))

        const settings = useSettings()
        const before = settings.app.media.images.uploadLimit

        await expect(settings.refresh()).rejects.toThrow("settings backend unavailable")
        expect(settings.app.media.images.uploadLimit).toBe(before)
        expect(settings.app.voting.enabled).toBe(true)
    })
})
