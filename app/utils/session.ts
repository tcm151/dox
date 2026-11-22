import { skipHydrate } from "pinia"
import type { Topic, User } from "@@/shared/types"

interface Tokens {
    access: string
    refresh?: string | undefined
}

export const getSession = defineStore("session", () => {
    const events = useEvents()

    //> SESSION
    const isAuthenticated = useSessionStorage<boolean>("authenticated", false)
    const tokens = useLocalStorage<Tokens>("tokens", { access: "" })
    const user = useSessionStorage<User>("user", () => ({
        id: 'user:temp',
        name: '',
        topics: [],
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

    const moderator = useSessionStorage<{ topics: string[] }>("moderator", { topics: [] })

    function moderates(topicIds: string | string[]): boolean {
        const topics = Array.isArray(topicIds) ? topicIds : [topicIds]
        return topics.every(t => moderator.value.topics.includes(t)) || hasRole(user.value, "admin")
    }

    function moderatesAny(topicIds: string[]): boolean {
        return topicIds.some(t => moderator.value.topics.some(m => m === t)) || hasRole(user.value, "admin")
    }

    async function getModeratorTopics(): Promise<void> {
        if (!hasRole(user.value, "moderator")) {
            moderator.value = { topics: [] }
            return
        }

        try {
            const topics = await useApi<Topic[]>("/api/moderator/topics")
            moderator.value = { topics: topics.map(topic => topic.id) }
        }
        catch (error: any) {
            moderator.value = { topics: [] }
        }
    }

    events.subscribe(Trigger.authenticatedUser, async () => {
        await getModeratorTopics()
    })

    // TODO this doesn't seem to update when a user switches profiles
    if (ENV.isClient() && isAuthenticated.value && hasRole(user.value, "moderator")) {
        void getModeratorTopics()
    }

    async function refreshProfile(): Promise<void> {
        try {
            user.value = await useApi<User>('/api/profile')
            await getModeratorTopics()
        }
        catch (error: any) {
            throw createError({
                status: 401,
                statusText: "You don't exist."
            })
        }
    }

    //> AUTH
    async function authenticate(existingToken?: string): Promise<void> {
        let token = existingToken ?? tokens.value.access
        user.value = await useApi<User>("/api/profile/authenticate", {
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
        let result = await useApi<{ user: User, tokens: Tokens }>("/api/profile/login", {
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
        moderator.value = { topics: [] }
        events.publish(Trigger.userLoggedOut, { user: user.value, clear: clear })
        isAuthenticated.value = false
        if (clear == true) {
            tokens.value = {
                access: ""
            }
            user.value = {
                id: 'user:temp',
                name: '',
                topics: [],
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
        moderator: skipHydrate(moderator),
        isAuthenticated: skipHydrate(isAuthenticated),
        moderates,
        moderatesAny,
        refreshProfile,
        authenticate,
        login,
        logout,
    }
})
