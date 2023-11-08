import type { Draft } from "~/types";

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const draft = await readBody(event)
    const { id } = event.context.params!

    let { sql, parameters } = queryBuilder()

    sql.push('IF $draft.user = $user.id {')
    sql.push('RETURN UPDATE $draft SET')
    sql.push('title = $title,')
    sql.push('content = $content,')
    sql.push('topics = $topics,')
    sql.push('time = time::now();')
    sql.push('};')
    
    parameters['draft'] = `draft:${id}`
    parameters['user'] = auth
    parameters['title'] = draft.title
    parameters['content'] = draft.content
    parameters['topics'] = draft.topics
    
    return await queryOne<Draft>({ sql, parameters })
})