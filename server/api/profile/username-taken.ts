export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)    
    const { username } = await readBody(event)

    try {
        await new DatabaseQuery()
            .addSql(`
                SELECT id
                FROM user
                WHERE name = $name
                AND id != $user
            `)
            .addParameter("name", username)
            .addRecord("user", auth.id)
            .queryOne<string>()

        return true
    }
    catch (error: any) {
        return false
    }
})
