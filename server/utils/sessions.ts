import type { User } from "~/types";
import { DatabaseQuery } from "./database"

interface Session {
    id: string
    user: User
    invalidated: boolean
}
class SessionManager {

    async add(user: User) {
        let session = await new DatabaseQuery()
            .addSql(`
                CREATE session SET
                    user = $user
            `)
            .addParameter("user", user.id)
            .queryOne<Session>()

        session.user = user

        await new DatabaseQuery()
            .addSql(`
                DELETE session
                WHERE user = $user
                AND invalidated = true
            `)
            .addRecord("user", session.user.id)
            .execute()

        return session
    }

    async authenticateToken(id: string) {
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
                    UPDATE $id SET
                        invalidated = true
                `)
                .addRecord("id", id)
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
            .addRecord("user", userId)
            .execute()
    }
}

const sessionManager = new SessionManager()

export const useSessions = (): SessionManager => {
    return sessionManager
}