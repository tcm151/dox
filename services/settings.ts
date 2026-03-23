import { skipHydrate } from "pinia"
import type { AppSettings } from "~/types"

interface UserPreferences {
    hintDuration: number
    hoverAnimations: boolean
}

export const useSettings = defineStore("user.settings", () => {
    const cache = useCache()

    const user = cache.get<UserPreferences>("user.settings", () => ({
        hintDuration: 2500,
        hoverAnimations: true,
    }))

    const app = ref<AppSettings>({
        id: "appSettings:default", 
        email: {
            support: "",
        },
        navbar: {
            showStore: true,
            showFeedback: true,
        },
        feed: {
            showSearch: true,
            showTopics: true,
            showThreads: true,
            showImages: true,
        },
        voting: {
            showMisleading: false,
            showNegative: true,
        }
    })

    async function fetch() {
        app.value = await $fetch<AppSettings>("/api/settings/default")
    }

    return { user: skipHydrate(user), app, fetch }
})