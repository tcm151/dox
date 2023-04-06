import { Ref } from "vue"
import { defineStore, skipHydrate } from "pinia"
import Surreal from "surrealdb.js"
import { User } from "~/types"

export interface Session {
    isAuthenticated: Ref<boolean>
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
        dateCreated: 'string',
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
            console.log(ex)
            return null
        }
    }

    //> AUTH
    async function authenticate() {
        try {
            await db.wait()
            await db.authenticate(token.value)

            isAuthenticated.value = true
            user.value = await useApi<User>('/api/profile')
            events.publish("authenticatedUser")
            return true
        }
        catch (ex: any) {
            console.log(ex)
            return false
        }
    }

    async function login(id: string, password: string) {
        try {
            await db.wait()
            token.value = await db.signin({
                NS: "dev",
                DB: "dox",
                SC: "account",
                id: id,
                password: password,
            })
            
            isAuthenticated.value = true
            user.value = await useApi<User>('/api/profile')
            events.publish("authenticatedUser")
            return true
        }
        catch (ex: any) {
            console.log(ex)
            return false
        }
    }

    function logout(clear: boolean) {
        isAuthenticated.value = false;
        if (clear == true) {
            user.value = null;
            token.value = ""
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
                    user.value?.topics.push(target)
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
                    user.value!.topics = user.value?.topics.filter(t => t !== target)!
                    return true
            }
        }
        catch (error: any) {
            hints.addError(error.message)
            return false
        }
    }

    return { user, isAuthenticated, authenticate, login, logout, useApi, follow, unfollow }
})
