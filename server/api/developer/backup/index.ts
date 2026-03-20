export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    if (!hasRole(auth, "developer")) {
        throw createError({
            statusCode: 401,
            message: "You shall not pass!"
        })
    }

    return await new DatabaseQuery()
        .addSql(`
            RETURN {
                LET $environment = $session.db;
                USE NS ${useRuntimeConfig().surreal.namespace} DB backup;
    
                RETURN SELECT id, time, user.id, user.name
                FROM backup
                WHERE environment = $environment
                ORDER BY time DESC
                FETCH user;
            }
        `)
        .queryOne<any>()
})