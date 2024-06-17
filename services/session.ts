import type { Ref } from "vue"
import { skipHydrate } from "pinia"
import Surreal from "surrealdb.js"
import type { User, Role, Trait } from "~/types"
import { Trigger } from "~/services/events";


export interface Session {
    isAuthenticated: Ref<boolean>
    token: Ref<string>
    user: Ref<User>
    useApi: <T>(route: string, body?: any) => Promise<T | null>
    authenticate: (userToken?: string) => Promise<boolean>
    login: (id: string, password: string) => Promise<boolean>
    logout: (clear: boolean) => void
    fetchProfile(): Promise<void>
    follow: (target: string) => Promise<boolean>
    unfollow: (target: string) => Promise<boolean>
}

export const getSession = defineStore("session", (): Session => {
    const events = useEvents()

    //> SESSION
    const isAuthenticated = useSessionStorage<boolean>("authenticated", false)
    const token = useLocalStorage<string>("token", "")
    const user = useSessionStorage<User>("user", {
        id: 'user:temp',
        email: '',
        name: '',
        votes: {
            positive: [],
            misleading: [],
            negative: [],
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
    async function useApi<T>(route: string, body?: any) {
        try {
            return $fetch<T>(route, {
                method: "POST",
                headers: {
                    Authorization: token.value,
                },
                body: body,
            }) as T
        }
        catch (ex: any) {
            events.publish(Trigger.addHint, {
                message: ex.message,
                type: "error",
            })
            return null
        }
    }

    async function fetchProfile(): Promise<void> {
        user.value = await useApi<User>('/api/profile')
        if (user.value == null) {
            throw createError({
                statusCode: 401,
                message: "You don't exist pal."
            })
        }
    }

    //> AUTH
    async function authenticate(userToken?: string) {
        const { public: { surreal } } = useRuntimeConfig()
        try {
            const db = new Surreal()
            await db.connect(surreal.url, {
                namespace: surreal.namespace,
                database: surreal.database,
            })
            
            if ((await db.authenticate(userToken ?? token.value)) && userToken) {
                token.value = userToken
            }
            await fetchProfile()
            await db.close()

            isAuthenticated.value = true
            events.publish(Trigger.authenticatedUser, {
                user: user.value,
                token: userToken ?? token.value,
            })
        }
        catch (ex: any) {
            isAuthenticated.value = false
        }

        return isAuthenticated.value
    }

    async function login(id: string, password: string) {
        const { public: { surreal } } = useRuntimeConfig()
        try {
            const db = new Surreal()
            await db.connect(surreal.url, {
                namespace: surreal.namespace,
                database: surreal.database,
            })

            token.value = await db.signin({
                namespace: surreal.namespace,
                database: surreal.database,
                scope: "account",
                id: id,
                password: password,
            })
            
            await fetchProfile()
            await db.close()

            isAuthenticated.value = true
            events.publish(Trigger.authenticatedUser, {
                user: user.value,
                token: token.value,
            })
        }
        catch (ex: any) {
            logout(true)
        }

        return isAuthenticated.value
    }

    async function logout(clear: boolean) {
        events.publish(Trigger.userLoggedOut, { user: user.value, clear: clear })
        isAuthenticated.value = false
        if (clear == true) {
            token.value = ""
            user.value = {
                id: 'user:temp',
                email: '',
                name: '',
                votes: {
                    positive: [],
                    misleading: [],
                    negative: [],
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
        
        try {
            if (target.startsWith("user")) {
                await useApi(`/api/user/${extractId(target)}/follow`)
                user.value?.following.push(target)
                return true
            }
            if (target.startsWith("topic")) {
                await useApi(`/api/topic/${extractId(target)}/follow`)
                user.value?.topics.push(target)
                return true
            }
        }
        catch (error: any) {
            events.publish(Trigger.addHint, {
                message: error.message,
                type: "error",
            })
        }

        return false
    }
    
    async function unfollow(target: string) {
        if (!isAuthenticated) {
            events.publish(Trigger.addHint, {
                message: "You must be logged into interact with others.",
                type: "error",
            })
            return false
        }
        
        try {
            if (target.startsWith("user")) {
                await useApi(`/api/user/${extractId(target)}/unfollow`)
                user.value!.following = user.value?.following.filter(u => u !== target)!
                return true
            }
            if (target.startsWith("topic")) {
                await useApi(`/api/topic/${extractId(target)}/unfollow`)
                user.value!.topics = user.value?.topics.filter(t => t !== target)!
                return true
            }
        }
        catch (error: any) {
            events.publish(Trigger.addHint, {
                message: error.message,
                type: "error",
            })
        }

        return false
    }

    return {
        user: skipHydrate(user),
        token: skipHydrate(token),
        isAuthenticated: skipHydrate(isAuthenticated),
        authenticate,
        login,
        logout,
        fetchProfile,
        useApi,
        follow,
        unfollow,
    }
})
