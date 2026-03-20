import type { Audio } from "~/types"

export default defineEventHandler(async (event) => {
    const { fileName } = event.context.params!
    const id = fileName?.split('.').at(0)

    var { sql, parameters } = queryBuilder()
    sql.push('SELECT id, user.id, user.name, votes, type, tokens, time, url')
    sql.push('FROM <record>$audio')
    parameters['audio'] = `audio:${id}`

    return await queryOne<Audio>({ sql, parameters })
})