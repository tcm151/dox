import { skipHydrate } from "pinia"
import { Trigger } from "~/services/events"
import type { User } from "~/types"


// export interface Session {
//     isAuthenticated: Ref<boolean>
//     tokens: Ref<{ access: string, refresh?: string | undefined; }>
//     user: Ref<User>
//     useApi: <T>(route: string, body?: any) => Promise<T | undefined>
//     authenticate: (userToken?: string) => Promise<void>
//     login: (id: string, password: string) => Promise<void>
//     logout: (clear: boolean) => void
//     refreshProfile(): Promise<void>
// }

export const getSession = defineStore("session", () => {
    const events = useEvents()

    //> SESSION
    const isAuthenticated = useSessionStorage<boolean>("authenticated", false)
    const tokens = useLocalStorage<{ access: string, refresh?: string | undefined; }>("tokens", { access: "" })
    const user = useSessionStorage<User>("user", {
        id: 'user:temp',
        email: '',
        name: '',
        votes: {
            positive: [],
            misleading: [],
            negative: [],
            awards: [],
            saves: [],
        },
        topics: [],
        following: [],
        followers: [],
        dateJoined: '',
        tokens: 0,
        score: 0,
        roles: [],
        traits: []
    })

    //> API
    async function useApi<T>(route: string, body?: any): Promise<T> {
        try {
            return await $fetch<T>(route, {
                method: "POST",
                headers: {
                    Authorization: tokens.value.access,
                },
                body: body,
            })
        }
        catch (error: any) {
            throw createError({
                status: 500,
                statusText: "Failed to make request to API.",
                message: error.message
            })
        }
    }

    async function refreshProfile(): Promise<void> {
        user.value = await useApi<User>('/api/profile')
        if (user.value == null) {
            throw createError({
                statusCode: 401,
                message: "You don't exist pal."
            })
        }
    }

    //> AUTH
    async function authenticate(existingToken?: string): Promise<void> {
        let token = existingToken ?? tokens.value.access
        user.value = await $fetch<User>("/api/profile/authenticate", {
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
        let result = await $fetch("/api/profile/login", {
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
        await useApi<User>('/api/profile/logout', { clear })
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
                votes: {
                    positive: [],
                    misleading: [],
                    negative: [],
                    awards: [],
                    saves: [],
                },
                topics: [],
                following: [],
                followers: [],
                dateJoined: '',
                score: 0,
                tokens: 0,
                roles: [],
                traits: [],
            }
        }
        return navigateTo("/feed")
    }

    return {
        user: skipHydrate(user),
        tokens: skipHydrate(tokens),
        isAuthenticated: skipHydrate(isAuthenticated),
        authenticate,
        login,
        logout,
        refreshProfile,
        useApi,
    }
})
