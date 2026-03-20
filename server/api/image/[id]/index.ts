import type { Image } from "~/types"

export default defineEventHandler(async (event) => {
    const { id } = event.context.params!

    var { sql, parameters } = queryBuilder()
    sql.push('SELECT id, user.id, user.name, votes, type, tokens, time, url')
    sql.push('FROM <record>$image')
    sql.push('FETCH user')
    parameters['image'] = `image:${id}`

    return await queryOne<Image>({ sql, parameters })
})