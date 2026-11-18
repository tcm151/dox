import { isError } from "h3"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)    
    const { username } = await readBody<{ username: string }>(event)

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
            .queryOne<{ id: string }>()

        return true
    } catch (error) {
        if (isError(error) && error.statusCode === 404) {
            return false
        }
        throw error
    }
})
