import Surreal from "surrealdb.js"
import { defineStore } from "pinia"
import { Session } from "~~/types/types";

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
    const token = ref("")
    watch(token, (token) => sessionStorage.setItem("token", token));
    
    function readToken() {
        token.value = sessionStorage.getItem("token") ?? "";
        return token.value;
    }
    
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
    async function follow(target: string) {
        await useApi(`/api/user/${target}/follow`);
    }
    
    async function unfollow(target: string) {
        await useApi(`/api/user/${target}/unfollow`);
    }

    return { state, isAuthenticated, user, readToken, authenticate, login, logout, useApi, follow, unfollow }
})
