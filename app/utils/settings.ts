import type { AppSettings } from "@@/shared/types"

export const useSettings = defineStore("app.settings", () => {
    const app = ref<AppSettings>({
        id: "appSettings:default", 
        about: {
            summary: "",
        },
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
            links: false,
            threads: true,
            images: true,
            audio: false,
            video: false,
            polls: false,
        },
        posts: {
            enabled: true,
        },
        links: {
            enabled: false,
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
        polls: {
            enabled: false,
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

    return { app, refresh }
})