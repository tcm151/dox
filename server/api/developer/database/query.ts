export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, "developer")
    
    let { query } = await readBody<{ query: string }>(event)

    // TODO add audit logging for queries
    
    return await new DatabaseQuery()
        .addSql(query)
        .execute()
})