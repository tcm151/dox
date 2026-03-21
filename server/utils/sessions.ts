import type { User } from "~/types";
import { DatabaseQuery } from "./database"

interface Session {
    id: string
    user: User
    invalidated: boolean
}
class SessionManager {
    // #sessions: Session[] = []

    async add(user: User): Promise<Session> {
        let session = await new DatabaseQuery()
            .addSql(`
                CREATE session SET
                    user = $user
            `)
            .addParameter("user", user.id)
            .queryOne<Session>()

        session.user = user
        // this.#sessions.push(session)

        // TODO delete old sessions

        return session
    }

    async authenticateToken(id: string): Promise<Session | undefined> {
        // if (this.#sessions.some(s => s.id == id)) {
        //     return Promise.resolve(this.#sessions.find(s => s.id == id))
        // }
        // try {
            return await new DatabaseQuery()
                .addSql(`
                    SELECT *
                    OMIT user.password
                    FROM $id
                    WHERE invalidated = false
                    FETCH user
                `)
                .addRecord("id", id)
                .queryOne<Session>()
        // }
        // catch (error: any) {
        //     return Promise.resolve(undefined)
        // }
    }

    async invalidateToken(id: string, clear: boolean) {
        if (clear) {
            // this.#sessions = this.#sessions.filter(s => s.id != id);
            await new DatabaseQuery()
                .addSql(`
                    UPDATE session SET
                        invalidated = true
                    WHERE token = $jwt
                `)
                .addParameter("jwt", id)
                .execute()
        }
    }

    async invalidateUser(userId: string) {
        // this.#sessions = this.#sessions.filter(s => s.user.id != userId)
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