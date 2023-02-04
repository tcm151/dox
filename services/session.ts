import Surreal from "surrealdb.js"
import { defineStore } from "pinia"
import { Session } from "~~/types/types";

export const getSession = defineStore("session", () => {
    const state = ref<Session>({
        authenticated: false,
        token: "",
        user: null
    })

    const db = Surreal.Instance;

    const isAuthenticated = computed(() => state.value.authenticated)
    const token = computed(() => state.value.token)
    const user = computed(() => state.value.user)

    async function authenticate(): Promise<boolean> {
        try {
            await db.authenticate(state.value.token);
            state.value.authenticated = true;
            return true;
        }
        catch (ex) {
            return false;
        }
    }

    async function login(id: string, password: string) {
        await db.connect("https://db.tcmdev.ca/rpc");
        const token = await db.signin({
            NS: "dev",
            DB: "dox",
            SC: "account",
            id: id,
            password: password,
        })
        
        await db.authenticate(token);
        const query = [
            `SELECT id, name, email, dateCreated, followers, following, topics`,
            `FROM user`,
            `WHERE id = $auth.id`,
        ]
        const result: any = await db.query(query.join(" "));
        const user = result[0].result[0];
        
        state.value = {
            authenticated: true,
            token: token,
            user: user,
        }
    }

    function logout(clear: boolean) {
        state.value.authenticated = false;
        if (clear == true) {
            state.value.token = "";
            state.value.user = null;
            console.log("session cleared.")
        }
    }

    return { state, isAuthenticated, token, user, authenticate, login, logout }
},
{
    persist: {
        storage: persistedState.sessionStorage,
    },
})
