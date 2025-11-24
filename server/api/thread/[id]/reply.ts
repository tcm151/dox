import type { Thread } from "~/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    let thread = await readBody<Thread>(event)
    thread.user = auth.id
    thread.votes.positive = [auth.id]

    var { sql, parameters } = queryBuilder()
    sql.push('CREATE thread')
    sql.push('CONTENT $thread')
    parameters['thread'] = thread
    
    thread = await queryOne<Thread>({ sql, parameters })

    let { id } = event.context.params!
    var { sql, parameters } = queryBuilder()
    sql.push('UPDATE $thread')
    sql.push('SET replies += $reply')
    parameters['thread'] = `thread:${id}`
    parameters['reply'] = thread.id
    await queryOne<Thread>({ sql, parameters })

    return thread
})