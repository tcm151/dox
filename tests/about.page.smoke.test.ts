// @vitest-environment nuxt

import { mountSuspended, mockNuxtImport } from "@nuxt/test-utils/runtime"
import { beforeEach, describe, expect, it, vi } from "vitest"
import AboutPage from "../app/pages/about.vue"

const useSettingsMock = vi.hoisted(() => vi.fn())
mockNuxtImport("useSettings", () => useSettingsMock)

describe("about page smoke", () => {
    beforeEach(() => {
        useSettingsMock.mockReturnValue({
            app: {
                about: undefined,
            },
        })
    })

    it("renders fallback text when about content is missing", async () => {
        const wrapper = await mountSuspended(AboutPage)
        expect(wrapper.text()).toContain("The about section has not been configured yet.")
    })
})
