import type { Error } from "@@/shared/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, "developer")

    const query = getQuery<{ limit: number, codes: number[], start: string, end: string }>(event)

    if (query.codes && !Array.isArray(query.codes)) {
        query.codes = [query.codes]
    }

    return await new DatabaseQuery()
        .addSql(`
            SELECT id, status, description, request, time, stack, data,
                user.id, user.name
            FROM error
            WHERE ($codes.len() = 0 OR $codes CONTAINS status)
            AND ($start = "" OR time >= <datetime>$start)
            AND ($end = "" OR time <= <datetime>$end)
            ORDER BY time DESC
            LIMIT $limit
        `)
        .addParameter("codes", query.codes?.map(s => Number(s)) ?? [])
        .addParameter("start", query.start)
        .addParameter("end", query.end)
        .addParameter("limit", Number(query.limit))
        .queryAll<Error>()
})