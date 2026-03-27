export default defineEventHandler(async (event) => {
    if (!ENV.isDevelopment()) {
        const auth = await authenticateRequest(event)
        requireRole(auth, "developer")
    }
    
    let { query } = await readBody<{ query: string }>(event)
    
    return await new DatabaseQuery()
        .addSql(query)
        .execute()
})