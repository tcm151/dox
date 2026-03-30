import type { Account } from "@@/shared/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)    

    return await new DatabaseQuery()
        .addSql(`
            SELECT *
            OMIT password
            FROM account
            WHERE user = $user
        `)
        .addRecord("user", auth.id)
        .queryOne<Account>()
})
