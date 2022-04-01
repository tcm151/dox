import { User } from "../api/types"
import { createStore, StoreOptions } from "vuex"
import createPersistedState from "vuex-persistedstate"

interface State {
    session: Session
}

export interface Session {
    user: User | null
    authenticated: boolean
}

const options: StoreOptions<State> = {
    state: {
        session: { user: null, authenticated: false },
    },
    plugins: [
        createPersistedState({
            storage: sessionStorage,
        }),
    ],
    getters: {
        getSession(state): Session {
            return state.session
        },
        getCurrentUser(state): User | null {
            return state.session.user
        }
    },
    mutations: {
        login(state, session): void {
            state.session = session
        },
        logout(state): void {
            state.session.authenticated = false
        },
    },
}

export const store = createStore(options)
