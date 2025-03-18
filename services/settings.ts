import { skipHydrate } from "pinia"

interface Settings {
    hintDuration: number
    hoverAnimations: boolean
}

export const useUserSettings = defineStore("user.settings", () => {
    const cache = useCache()
    const user = cache.get<Settings>("user.settings", () => ({
        hintDuration: 2500,
        hoverAnimations: true,
    }))
    
    return { user: skipHydrate(user) }
})

interface AppSettings {
    navbar: {
        showStore: boolean,
        showFeedback: boolean,
    }
    feed: {
        showTopics: boolean,
        showThreads: boolean,
        showImages: boolean,
    }
}

export const useAppSettings = defineStore("app.settings", () => {
    const cache = useCache()
    const config = cache.get<AppSettings>("app.settings", () => ({
        navbar: {
            showStore: true,
            showFeedback: true,
        },
        feed: {
            showTopics: true,
            showThreads: true,
            showImages: true,
        }
    }))
    
    return { app: skipHydrate(config) }
})