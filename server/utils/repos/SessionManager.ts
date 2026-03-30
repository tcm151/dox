export class SessionManager {
    static async add(account: Account) {
        return await new DatabaseQuery()
            .addSql(`
                RETURN {
                    LET $sesh = (CREATE ONLY session SET account = $account);
    
                    DELETE session
                    WHERE account = $account
                    AND (invalidated = true OR time::now()-time > 14d);
    
                    RETURN SELECT *
                    FROM session
                    WHERE id = $sesh.id
                    FETCH account, account.user;
                }
            `)
            .addParameter("account", account.id)
            .queryOne<Session>()
    }

    static async authenticateLogin(id: string, password: string) {
        const account = await new DatabaseQuery()
            .addSql(`
                SELECT *
                OMIT password
                FROM account
                WHERE (email = $id OR user.name = $id)
                AND crypto::argon2::compare(password, $password)
                FETCH user;
            `)
            .addParameter("id", id)
            .addParameter("password", password)
            .queryOne<Account>()

        return await this.add(account);
    }

    static async authenticateToken(id: string) {
        return await new DatabaseQuery()
            .addSql(`
                SELECT *
                FROM session
                WHERE id = $id
                AND invalidated = false
                FETCH account, account.user;
            `)
            .addRecord("id", id)
            .queryOne<Session>()
    }

    static async invalidateToken(id: string) {
        await new DatabaseQuery()
            .addSql(`
                UPDATE session SET
                    invalidated = true
                WHERE id = $id;
            `)
            .addRecord("id", id)
            .execute()
    }

    static async invalidateAccount(account: Account) {
        await new DatabaseQuery()
            .addSql(`
                UPDATE session SET
                    invalidated = true
                WHERE account.id = $account;
            `)
            .addRecord("account", account.id)
            .execute()
    }
}