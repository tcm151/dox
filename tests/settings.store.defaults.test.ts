// @vitest-environment nuxt

import { mockNuxtImport } from "@nuxt/test-utils/runtime"
import { createPinia, setActivePinia } from "pinia"
import { ref } from "vue"
import { beforeEach, describe, expect, it } from "vitest"
import { useSettings } from "../app/utils/settings"

const useCacheMock = () => ({
    get: <T>(_: string, fallback: () => T) => ref(fallback()),
})
mockNuxtImport("useCache", () => useCacheMock)

describe("settings store defaults", () => {
    beforeEach(() => {
        setActivePinia(createPinia())
    })

    it("has safe defaults before refresh", () => {
        const settings = useSettings()

        expect(settings.app.id).toBe("appSettings:default")
        expect(settings.app.voting.enabled).toBe(true)
        expect(settings.app.topics.perSubmission).toBe(3)
        expect(settings.app.media.images.enabled).toBe(true)
        expect(settings.app.misc.feedback.enabled).toBe(true)
    })
})
