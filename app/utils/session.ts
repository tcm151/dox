import { skipHydrate } from "pinia"
import type { Profile } from "@@/shared/types"

interface Tokens {
    access: string
    refresh?: string | undefined
}

export const getSession = defineStore("session", () => {
    const events = useEvents()

    //> SESSION
    const isAuthenticated = useSessionStorage<boolean>("authenticated", false)
    const tokens = useLocalStorage<Tokens>("tokens", { access: "" })
    const user = useSessionStorage<Profile>("user", () => ({
        id: 'user:temp',
        name: '',
        topics: { following: [], moderates: [] },
        followers: [],
        following: [],
        time: "",
        visits: 0,
        dateJoined: '',
        tokens: 0,
        score: 0,
        roles: [],
        traits: [],
        votes: {
            positive: [],
            misleading: [],
            negative: [],
            awards: [],
            saves: [],
        },
    }))

    function moderates(topicIds: string | string[]): boolean {
        if (!hasRole(user.value, "moderator")) return false
        const topics = Array.isArray(topicIds) ? topicIds : [topicIds]
        return topics.every(topic => user.value.topics.moderates.includes(topic))
    }

    function moderatesAny(topicIds: string[]): boolean {
        return topicIds.some(topic => moderates(topic))
    }

    async function refreshProfile(): Promise<void> {
        const accessToken = tokens.value.access
        const profile = await useApi<Profile>("/api/profile")
        if (isAuthenticated.value && tokens.value.access === accessToken && user.value.id === profile.id) {
            user.value = profile
        }
    }

    //> AUTH
    async function authenticate(existingToken?: string): Promise<void> {
        let token = existingToken ?? tokens.value.access
        user.value = await useApi<Profile>("/api/profile/authenticate", {
            headers: {
                Authorization: token
            }
        })
        tokens.value = { access: token }
        isAuthenticated.value = true
        events.publish(Trigger.authenticatedUser, {
            user: user.value,
            token: tokens.value.access,
        })
    }

    async function login(id: string, password: string): Promise<void> {
        let result = await useApi<{ user: Profile, tokens: Tokens }>("/api/profile/login", {
            headers: {
                Authorization: btoa(`${id}:${password}`),
            }
        })
        user.value = result.user
        tokens.value = result.tokens
        isAuthenticated.value = true
        events.publish(Trigger.authenticatedUser, {
            user: user.value,
            token: tokens.value.access,
        })
    }

    async function logout(clear: boolean) {
        await useApi('/api/profile/logout', {
            body: {
                clear: clear
            }
        })
        user.value.topics.moderates = []
        events.publish(Trigger.userLoggedOut, { user: user.value, clear: clear })
        isAuthenticated.value = false
        if (clear == true) {
            tokens.value = {
                access: ""
            }
            user.value = {
                id: 'user:temp',
                name: '',
                topics: { following: [], moderates: [] },
                followers: [],
                following: [],
                visits: 0,
                dateJoined: '',
                tokens: 0,
                score: 0,
                roles: [],
                traits: [],
                votes: {
                    positive: [],
                    misleading: [],
                    negative: [],
                    awards: [],
                    saves: [],
                },
            }
        }
        return navigateTo("/feed")
    }

    return {
        user: skipHydrate(user),
        tokens: skipHydrate(tokens),
        isAuthenticated: skipHydrate(isAuthenticated),
        moderates,
        moderatesAny,
        refreshProfile,
        authenticate,
        login,
        logout,
    }
})
