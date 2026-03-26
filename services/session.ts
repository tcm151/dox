import { skipHydrate } from "pinia"
import { Trigger } from "~/services/events"
import type { User } from "~/types"

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
        email: '',
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

    async function refreshProfile(): Promise<void> {
        try {
            user.value = await useApi<User>('/api/profile')
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
        let result = await useApi("/api/profile/login", {
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
        events.publish(Trigger.userLoggedOut, { user: user.value, clear: clear })
        isAuthenticated.value = false
        if (clear == true) {
            tokens.value = {
                access: ""
            }
            user.value = {
                id: 'user:temp',
                email: '',
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
            }
        }
        return navigateTo("/feed")
    }

    return {
        user: skipHydrate(user),
        tokens: skipHydrate(tokens),
        isAuthenticated: skipHydrate(isAuthenticated),
        refreshProfile,
        authenticate,
        login,
        logout,
    }
})
