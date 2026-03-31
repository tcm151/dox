// @vitest-environment nuxt

import { createPinia, setActivePinia } from "pinia"
import { beforeEach, describe, expect, it, vi } from "vitest"

const useApiMock = vi.hoisted(() => vi.fn())
const navigateToMock = vi.hoisted(() => vi.fn())
const publishMock = vi.hoisted(() => vi.fn())

describe("user auth journey", () => {
    beforeEach(() => {
        vi.resetModules()
        setActivePinia(createPinia())
        vi.unstubAllGlobals()
        vi.stubGlobal("useApi", useApiMock)
        vi.stubGlobal("useEvents", () => ({ publish: publishMock }))
        vi.stubGlobal("navigateTo", navigateToMock)
        vi.stubGlobal("Trigger", {
            authenticatedUser: "authenticatedUser",
            userLoggedOut: "userLoggedOut",
        })

        const sessionMap: Record<string, any> = {}
        const localMap: Record<string, any> = {}

        vi.stubGlobal("useSessionStorage", (key: string, initial: any) => {
            if (!(key in sessionMap)) {
                const value = typeof initial === "function" ? initial() : initial
                sessionMap[key] = { value }
            }
            return sessionMap[key]
        })
        vi.stubGlobal("useLocalStorage", (key: string, initial: any) => {
            if (!(key in localMap)) {
                const value = typeof initial === "function" ? initial() : initial
                localMap[key] = { value }
            }
            return localMap[key]
        })
    })

    it("logs in then logs out with token reset", async () => {
        useApiMock
            .mockResolvedValueOnce({
                user: { id: "user:1", name: "dev", roles: [], traits: [], votes: { positive: [], misleading: [], negative: [], awards: [], saves: [] }, topics: [], followers: [], following: [], time: "", visits: 0, dateJoined: "", tokens: 0, score: 0 },
                tokens: { access: "session:1" },
            })
            .mockResolvedValueOnce({})

        const { getSession } = await import("../app/utils/session")
        const session = getSession()

        await session.login("dev", "password")
        expect(session.isAuthenticated.value).toBe(true)
        expect(session.tokens.value.access).toBe("session:1")

        await session.logout(true)
        expect(session.isAuthenticated.value).toBe(false)
        expect(session.tokens.value.access).toBe("")
        expect(navigateToMock).toHaveBeenCalledWith("/feed/discover")
    })
})
