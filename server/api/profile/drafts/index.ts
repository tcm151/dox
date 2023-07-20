import { Draft } from "~/types";

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    var { sql, parameters } = queryBuilder()
    sql.push('SELECT *')
    sql.push('FROM draft')
    sql.push('WHERE user = $user')
    sql.push('ORDER BY time DESC')
    parameters['user'] = auth.id
    return await queryAll<Draft>({ sql, parameters })
})