import type { User, Session } from "~/types";

class SessionManager {

    async add(user: User) {
        let session = await new DatabaseQuery()
            .addSql(`
                CREATE session SET
                    user = $user;
            `)
            .addParameter("user", user.id)
            .queryOne<Session>()

        session.user = user as User & string

        await new DatabaseQuery()
            .addSql(`
                DELETE session
                WHERE user = $user
                AND (invalidated = true OR time::now()-time > 14d);
            `)
            .addRecord("user", session.user.id)
            .execute()

        return session
    }

    async authenticateLogin(id: string, password: string) {
        const user = await new DatabaseQuery()
            .addSql(`
                SELECT *
                OMIT password
                FROM user
                WHERE (email = $id OR name = $id)
                AND crypto::argon2::compare(password, $password);
            `)
            .addParameter("id", id)
            .addParameter("password", password)
            .queryOne<User>()

        return await this.add(user);
    }

    async authenticateToken(id: string) {
        return await new DatabaseQuery()
            .addSql(`
                SELECT *
                FROM session
                WHERE id = $id
                AND invalidated = false
                FETCH user;
            `)
            .addRecord("id", id)
            .queryOne<Session>()
    }

    async invalidateToken(id: string, clear: boolean) {
        if (clear) {
            await new DatabaseQuery()
                .addSql(`
                    UPDATE session SET
                        invalidated = true
                    WHERE id = $id;
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
                WHERE user = $user;
            `)
            .addRecord("user", userId)
            .execute()
    }
}

const sessionManager = new SessionManager()

export const useSessions = (): SessionManager => {
    return sessionManager
}