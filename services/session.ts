import { Ref } from "vue"
import { defineStore, skipHydrate } from "pinia"
import Surreal from "surrealdb.js"
import { User } from "~/types"
import { Trigger } from "~/services/events";


export interface Session {
    isAuthenticated: Ref<boolean>
    token: Ref<string>
    user: Ref<User>
    useApi: <T>(route: string, body?: any) => Promise<T | null>
    authenticate: () => Promise<boolean>
    login: (id: string, password: string) => Promise<boolean>
    logout: (clear: boolean) => void
    follow: (type: "user" | "topic", target: string) => Promise<boolean>
    unfollow: (type: "user" | "topic", target: string) => Promise<boolean>
}

export const getSession = defineStore("session", (): Session => {
    
    const hints = useHints()
    const events = useEvents()

    const db = Surreal.Instance
    db.connect("https://db.tcmdev.ca/rpc")
    
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
        },
        topics: [],
        following: [],
        followers: [],
        dateCreated: '',
        confirmed: false,
        verified: false,
        admin: false,
    }))

    //> API
    async function useApi<T>(route: string, body?: any) {
        try {
            return $fetch<T>(route, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token.value}`,
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
        try {
            await db.wait()
            await db.authenticate(token.value)
            await fetchProfile()

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
            await db.wait()
            token.value = await db.signin({
                NS: surreal.namespace,
                DB: surreal.database,
                SC: "account",
                id: id,
                password: password,
            })
            await fetchProfile()

            isAuthenticated.value = true
            events.publish(Trigger.authenticatedUser)
        }
        catch (ex: any) {
            console.log(ex)
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
                },
                topics: [],
                following: [],
                followers: [],
                dateCreated: '',
                confirmed: false,
                verified: false,
                admin: false
            }
        }
    }

    //> FOLLOW/UNFOLLOW
    async function follow(type: "user" | "topic", target: string) {
        if (!isAuthenticated) {
            hints.addError("You must be logged into interact with others.")
            return false
        }
        
        try {
            switch (type) {
                case "user":
                    await useApi(`/api/user/${target}/follow`)
                    user.value?.following.push(`user:${target}`)
                    return true
                case "topic":
                    await useApi(`/api/topic/${target}/follow`)
                    user.value?.topics.push(`topic:${target}`)
                    return true
            }
        }
        catch (error: any) {
            hints.addError(error.message)
            return false;
        }
    }
    
    async function unfollow(type: "user" | "topic", target: string) {
        if (!isAuthenticated) {
            hints.addError("You must be logged into interact with others.")
            return false
        }
        
        try {
            switch (type) {
                case "user":
                    await useApi(`/api/user/${target}/unfollow`)
                    user.value!.following = user.value?.following.filter(u => u !== `user:${target}`)!
                    return true
                case "topic":
                    await useApi(`/api/topic/${target}/unfollow`)
                    user.value!.topics = user.value?.topics.filter(t => t !== `topic:${target}`)!
                    return true
            }
        }
        catch (error: any) {
            hints.addError(error.message)
            return false
        }
    }

    return { user, token, isAuthenticated, authenticate, login, logout, useApi, follow, unfollow }
})
