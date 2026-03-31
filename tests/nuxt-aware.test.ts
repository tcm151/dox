// @vitest-environment nuxt

import { useRoute } from "#app"
import { mountSuspended } from "@nuxt/test-utils/runtime"
import { defineComponent } from "vue"
import { describe, expect, it } from "vitest"

describe("nuxt-aware smoke test", () => {
    it("provides Nuxt runtime composables in test context", async () => {
        const TestComponent = defineComponent({
            setup() {
                const route = useRoute()
                return { routePath: route.path }
            },
            template: '<div data-testid="route">{{ routePath }}</div>',
        })

        const wrapper = await mountSuspended(TestComponent, {
            route: "/about",
        })

        expect(wrapper.get("[data-testid=route]").text()).toBe("/about")
    })
})
