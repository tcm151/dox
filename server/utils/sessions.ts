import type { User } from "~/types";
import { DatabaseQuery } from "./database"

interface Session {
    id: string
    user: User
    invalidated: boolean
}
class SessionManager {

    async add(user: User): Promise<Session> {
        let session = await new DatabaseQuery()
            .addSql(`
                CREATE session SET
                    user = $user
            `)
            .addParameter("user", user.id)
            .queryOne<Session>()

        session.user = user

        // TODO delete old sessions

        return session
    }

    async authenticateToken(id: string): Promise<Session | undefined> {
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
    }

    async invalidateToken(id: string, clear: boolean) {
        if (clear) {
            await new DatabaseQuery()
                .addSql(`
                    UPDATE $session SET
                        invalidated = true
                `)
                .addParameter("session", id)
                .execute()
        }
    }

    async invalidateUser(userId: string) {
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