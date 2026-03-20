import type { Ref } from "vue"
import { skipHydrate } from "pinia"
import type { User } from "~/types"
import { Trigger } from "~/services/events"


export interface Session {
    isAuthenticated: Ref<boolean>
    tokens: Ref<{ access: string, refresh?: string | undefined; }>
    user: Ref<User>
    useApi: <T>(route: string, body?: any) => Promise<T | undefined>
    authenticate: (userToken?: string) => Promise<void>
    login: (id: string, password: string) => Promise<void>
    logout: (clear: boolean) => void
    refreshProfile(): Promise<void>
    follow: (target: string) => Promise<boolean>
    unfollow: (target: string) => Promise<boolean>
}

export const getSession = defineStore("session", (): Session => {
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
            score: 0
        },
        topics: [],
        following: [],
        followers: [],
        dateJoined: '',
        tokens: 0,
        roles: [],
        traits: []
    })

    //> API
    async function useApi<T>(route: string, body?: any): Promise<T | undefined> {
        return await $fetch<T>(route, {
            method: "POST",
            headers: {
                Authorization: tokens.value.access,
            },
            body: body,
        }) as T
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
    async function authenticate(existingToken?: string) {
        user.value = await $fetch("/api/profile/authenticate", {
            headers: {
                Authorization: existingToken ?? tokens.value.access
            }
        })
        isAuthenticated.value = true
        events.publish(Trigger.authenticatedUser, {
            user: user.value,
            token: tokens.value.access,
        })
    }

    async function login(id: string, password: string) {
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
                    score: 0
                },
                topics: [],
                following: [],
                followers: [],
                dateJoined: '',
                tokens: 0,
                roles: [],
                traits: [],
            }
        }
        return navigateTo("/feed")
    }

    //> FOLLOW/UNFOLLOW
    async function follow(target: string) {
        if (!isAuthenticated) {
            events.publish(Trigger.addHint, {
                message: "You must be logged into interact with others.",
                type: "error",
            })
            return false
        }
        
        if (target.startsWith("user")) {
            await useApi(`/api/user/${extractId(target)}/follow`)
            user.value.following.push(target)
        }
        if (target.startsWith("topic")) {
            await useApi(`/api/topic/${extractId(target)}/follow`)
            user.value.topics.push(target)
        }
        return true
    }
    
    async function unfollow(target: string) {
        if (!isAuthenticated) {
            events.publish(Trigger.addHint, {
                message: "You must be logged into interact with others.",
                type: "error",
            })
            return false
        }
        
        if (target.startsWith("user")) {
            await useApi(`/api/user/${extractId(target)}/unfollow`)
            user.value.following = user.value.following.filter(u => u !== target)
        }
        if (target.startsWith("topic")) {
            await useApi(`/api/topic/${extractId(target)}/unfollow`)
            user.value.topics = user.value.topics.filter(t => t !== target)
        }
        return true
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
        follow,
        unfollow,
    }
})
