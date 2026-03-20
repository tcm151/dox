import type { User } from "~/types";
import { DatabaseQuery } from "./database"

interface Session {
    id: string
    user: User
    token: string
    invalidated: boolean
}
class SessionManager {
    #sessions: Session[] = []

    async add(token: string, user: User): Promise<Session> {
        const session = await new DatabaseQuery()
            .addSql(`
                CREATE session SET
                    user = $user,
                    token = $jwt  
            `)
            .addParameter("user", user.id)
            .addParameter("jwt", token)
            .queryOne<Session>()

        this.#sessions.push(session)

        // TODO: delete old sessions

        return session
    }

    async authenticateToken(token: string): Promise<Session | undefined> {
        if (this.#sessions.some(s => s.token == token)) {
            return Promise.resolve(this.#sessions.find(s => s.token == token))
        }
        try {
            return await new DatabaseQuery()
                .addSql(`
                    SELECT id, token, user
                    FROM session
                    WHERE token = $jwt
                    AND invalidated = false
                    FETCH user
                `)
                .addParameter("jwt", token)
                .queryOne<Session>()
        }
        catch (error: any) {
            return Promise.resolve(undefined)
        }
    }

    async invalidateToken(token: string, clear: boolean) {
        if (clear) {
            this.#sessions = this.#sessions.filter(s => s.token != token);
            await new DatabaseQuery()
                .addSql(`
                    UPDATE session SET
                        invalidated = true
                    WHERE token = $jwt
                `)
                .addParameter("jwt", token)
                .execute()
        }
    }

    async invalidateUser(userId: string) {
        this.#sessions = this.#sessions.filter(s => s.user.id != userId)
        await new DatabaseQuery()
            .addSql(`
                UPDATE session SET
                    invalidated = true
                WHERE user = $user
            `)
            .addParameter("user", userId)
            .execute()
    }
}

const sessionManager = new SessionManager()

export const useSessions = (): SessionManager => {
    return sessionManager
}