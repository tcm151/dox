import { Ref } from "vue"
import { defineStore, skipHydrate } from "pinia"
import Surreal from "surrealdb.js"
import { User } from "~/types"

const hints = useHints();
const events = useEvents();

export interface Session {
    user: Ref<User | null>
    isAuthenticated: Ref<boolean>
    authenticate: Function
    login: Function
    logout: Function
    useApi: <T>(route: string, body?: any) => Promise<T | null>
    follow: Function
    unfollow: Function
}

export const getSession = defineStore("session", (): Session => {
    
    const db = Surreal.Instance;
    db.connect("https://db.tcmdev.ca/rpc")
    
    //> SESSION
    const isAuthenticated = skipHydrate(useSessionStorage<boolean>("authenticated", false))
    const token = skipHydrate(useLocalStorage<string>("token", ""));
    const user = skipHydrate(useSessionStorage<User | null>("user", {
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

    //> AUTH
    async function authenticate(): Promise<boolean> {
        try {
            await db.wait();
            await db.authenticate(token.value);

            isAuthenticated.value = true
            user.value = await useApi<User>('/api/profile')
            events.publish("authenticatedUser");
            return true
        }
        catch (ex: any) {
            console.log(ex)
            return false;
        }
    }

    async function login(id: string, password: string): Promise<boolean> {
        try {
            await db.wait();
            token.value = await db.signin({
                NS: "dev",
                DB: "dox",
                SC: "account",
                id: id,
                password: password,
            })
            
            isAuthenticated.value = true
            user.value = await useApi<User>('/api/profile')
            events.publish("authenticatedUser");
            return true
        }
        catch (ex: any) {
            console.log(ex)
            return false;
        }
    }

    function logout(clear: boolean) {
        isAuthenticated.value = false;
        if (clear == true) {
            user.value = null;
            token.value = ""
        }
    }

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

    //> FOLLOW/UNFOLLOW
    async function follow(type: "user" | "topic", target: string) {
        if (!isAuthenticated) {
            hints.addError("You must be logged into interact with others.");
            return false;
        }
        
        try {
            if (type === "user") {
                await useApi(`/api/user/${target}/follow`);
                user.value?.following.push(`user:${target}`);
                return true;
            }
            if (type === "topic") {
                await useApi(`/api/topic/${target}/follow`);
                user.value?.topics.push(target);
                return true;
            }
        }
        catch (error: any) {
            hints.addError(error.message)
        }
    }
    
    async function unfollow(type: "user" | "topic", target: string) {
        if (!isAuthenticated) {
            hints.addError("You must be logged into interact with others.");
            return false;
        }
        
        try {
            if (type === "user") {
                await useApi(`/api/user/${target}/unfollow`);
                user.value!.following = user.value?.following.filter(u => u !== `user:${target}`)!;
                return true;
            }
            if (type === "topic") {
                await useApi(`/api/topic/${target}/unfollow`);
                user.value!.topics = user.value?.topics.filter(t => t !== target)!;
                return true;
            }
        }
        catch (error: any) {
            hints.addError(error.message)
        }
    }

    return { user, isAuthenticated, authenticate, login, logout, useApi, follow, unfollow }
})
