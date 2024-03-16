import type { Ref } from "vue"
import { defineStore, skipHydrate } from "pinia"
import Surreal from "surrealdb.js"
import type { User } from "~/types"
import { Trigger } from "~/services/events";


export interface Session {
    isAuthenticated: Ref<boolean>
    token: Ref<string>
    user: Ref<User>
    useApi: <T>(route: string, body?: any) => Promise<T | null>
    authenticate: () => Promise<boolean>
    login: (id: string, password: string) => Promise<boolean>
    logout: (clear: boolean) => void
    fetchProfile(): Promise<void>
    follow: (target: string) => Promise<boolean>
    unfollow: (target: string) => Promise<boolean>
}

export const getSession = defineStore("session", (): Session => {
    
    const hints = useHints()
    const events = useEvents()

    //> SESSION
    const isAuthenticated = skipHydrate(useSessionStorage<boolean>("authenticated", false))
    const token = skipHydrate(useLocalStorage<string>("token", ""))
    const user = skipHydrate(useSessionStorage<User>("user", {
        id: '',
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
        dateCreated: '',
        confirmed: false,
        verified: false,
        admin: false,
        tokens: 0
    }))

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
            hints.addError(ex.message)
            throw ex
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
    async function authenticate() {
        const { public: { surreal } } = useRuntimeConfig()
        try {
            const db = new Surreal()
            await db.connect(surreal.url, {
                namespace: surreal.namespace,
                database: surreal.database,
            })
            
            await db.authenticate(token.value)
            await fetchProfile()
            await db.close()

            isAuthenticated.value = true
            events.publish(Trigger.authenticatedUser)
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
            events.publish(Trigger.authenticatedUser)
        }
        catch (ex: any) {
            logout(true)
        }

        return isAuthenticated.value
    }

    function logout(clear: boolean) {
        isAuthenticated.value = false;
        if (clear == true) {
            token.value = ""
            user.value = {
                id: '',
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
                dateCreated: '',
                confirmed: false,
                verified: false,
                admin: false,
                tokens: 0,
            }
        }
        return navigateTo("/feed")
    }

    //> FOLLOW/UNFOLLOW
    async function follow(target: string) {
        if (!isAuthenticated) {
            hints.addError("You must be logged into interact with others.")
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
            hints.addError(error.message)
        }

        return false
    }
    
    async function unfollow(target: string) {
        if (!isAuthenticated) {
            hints.addError("You must be logged into interact with others.")
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
            hints.addError(error.message)
        }

        return false
    }

    return { user, token, isAuthenticated, authenticate, login, logout, fetchProfile, useApi, follow, unfollow }
})
