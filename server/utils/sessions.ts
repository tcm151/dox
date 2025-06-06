import type { User } from "~/types";

interface Session {
    id: string
    user: User
}

class SessionManager {
    #sessions: Session[] = []

    add(sessionId: string, user: User) {
        // TODO use the database for persistent storage
        this.#sessions.push({ id: sessionId, user })
    }

    invalidate(sessionId: string) {
        this.#sessions = this.#sessions.filter(s => s.id != sessionId);
    }

    isAuthenticated(sessionId: string): User | undefined {
        const session = this.#sessions.find(s => s.id == sessionId)
        return session?.user
    }
}

const sessionManager = new SessionManager()

export const useSessions = () => {
    return sessionManager
}