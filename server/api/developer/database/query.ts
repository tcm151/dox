export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, "developer")
    
    let { query } = await readBody<{ query: string }>(event)

    if (query.includes("developerQuery")) {
        throw createError({
            status: 400,
            statusText: "You aren't allowed to execute this query.",
            message: "Executing queries against the `developerQuery` table is not allowed."
        })
    }

    const results = await new DatabaseQuery()
        .addSql(query)
        .execute()

    try {
        await new DatabaseQuery()
            .addSql(`
                CREATE developerQuery SET
                    user = $user,
                    sql = $sql,
                    results = $results
            `)
            .addRecord("user", auth.id)
            .addParameter("sql", query)
            .addParameter("results", results)
            .execute()
    }
    catch (error: any) {
        console.log(error)
    }

    return results
})