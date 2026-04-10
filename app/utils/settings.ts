import { skipHydrate } from "pinia"
import type { AppSettings } from "@@/shared/types"

interface UserSettings {
    hintDuration: number
    hoverAnimations: boolean
}

export const useSettings = defineStore("user.settings", () => {
    const cache = useCache()

    const user = cache.get<UserSettings>("user.settings", () => ({
        hintDuration: 2500,
        hoverAnimations: true,
    }))

    const app = ref<AppSettings>({
        id: "appSettings:default", 
        email: {
            support: "",
            additional: "",
        },
        moderation: {
            perTopic: 3,
            threshold: 2,
        },
        voting: {
            enabled: true,
            misleading: true,
            negative: true,
        },
        topics: {
            perSubmission: 3,
            restrict: false,
            allowed: [],
        },
        feeds: {
            search: true,
            discover: true,
            topics: true,
            posts: true,
            threads: true,
            images: true,
            audio: false,
            video: false,
        },
        posts: {
            enabled: true,
        },
        threads: {
            enabled: true,
        },
        media: {
            tokens: {
                enabled: false,
            },
            images: {
                enabled: true,
                uploadLimit: 10,
            },
            audio: {
                enabled: false,
                uploadLimit: 100,
            },
            video: {
                enabled: false,
                uploadLimit: 500,
            }
        },
        misc: {
            feedback: {
                enabled: true,
                allowAnonymous: false,
            }
        }
    })

    async function refresh() {
        app.value = await useApi<AppSettings>("/api/settings/default", {
            method: "GET"
        })
    }

    return { user: skipHydrate(user), app, refresh }
})