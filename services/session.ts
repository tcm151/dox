import Surreal from "surrealdb.js"
import { Session } from "~/types/types";
import { defineStore, skipHydrate } from "pinia"

const hints = useHints();
const events = useEvents();

export const getSession = defineStore("session", () => {
    
    const db = Surreal.Instance;
    
    //> SESSION
    const state = ref<Session>({
        authenticated: false,
        user: null
    })
    const isAuthenticated = computed(() => state.value.authenticated)
    const user = computed(() => state.value.user)

    //> TOKEN
    const token = skipHydrate(useSessionStorage("token", ""));
    
    //> AUTH
    async function authenticate(): Promise<boolean> {
        try {
            await db.connect("https://db.tcmdev.ca/rpc");
            await db.authenticate(token.value);

            const query = [
                `SELECT id, name, email, dateCreated, followers, following, topics`,
                `FROM user`,
                `WHERE id = $auth.id`,
            ]
            const result: any = await db.query(query.join("\n"));
            const user = result[0].result[0];
            
            console.log(user)

            state.value = {
                authenticated: true,
                user: user,
            }
            
            events.publish("authenticatedUser");
            return true;
        }
        catch (ex) {
            return false;
        }
    }

    async function login(id: string, password: string) {
        await db.connect("https://db.tcmdev.ca/rpc");
        token.value = await db.signin({
            NS: "dev",
            DB: "dox",
            SC: "account",
            id: id,
            password: password,
        })
        
        await authenticate();
    }

    function logout(clear: boolean) {
        state.value.authenticated = false;
        if (clear == true) {
            state.value.user = null;
            token.value = ""
        }
    }

    //> API
    async function useApi<T>(route: string, body?: any) {
        try {
            return await $fetch<T>(route, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token.value}`,
                },
                body: body,
            })
        }
        catch (ex) {
            hints.addError("Failed to authenticate session.");
            clearError();
        }
    }

    //> FOLLOW/UNFOLLOW
    async function follow(type: "user" | "topic", target: string) {
        if (!isAuthenticated) {
            hints.addError("You must be logged into interact with others.");
            return false;
        }
        
        if (type === "user") {
            await useApi(`/api/user/${target}/follow`);
            state.value.user?.following.push(`user:${target}`);
            return true;
        }
        if (type === "topic") {
            await useApi(`/api/topic/${target}/follow`);
            state.value.user?.topics.push(target);
            return true;
        }
    }
    
    async function unfollow(type: "user" | "topic", target: string) {
        if (!isAuthenticated) {
            hints.addError("You must be logged into interact with others.");
            return false;
        }
        
        if (type === "user") {
            await useApi(`/api/user/${target}/follow`);
            state.value.user!.following = state.value.user?.following.filter(u => u !== `user:${target}`)!;
            return true;
        }
        if (type === "topic") {
            await useApi(`/api/topic/${target}/follow`);
            state.value.user!.topics = state.value.user?.topics.filter(t => t !== target)!;
            return true;
        }
    }

    return { state, isAuthenticated, user, authenticate, login, logout, useApi, follow, unfollow }
})
