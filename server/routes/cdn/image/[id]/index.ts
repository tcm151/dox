import fs from "node:fs"
import type { Image } from "~/types"


export default defineEventHandler(async (event) => {
    const { id } = event.context.params!

    var { sql, parameters } = queryBuilder()
    sql.push('SELECT *')
    sql.push('FROM <record>$image')
    sql.push('FETCH user')
    parameters['image'] = `image:${id}`
    const image = await queryOne<Image>({ sql, parameters })
    
    try {
        return fs.readFileSync(`./media/image/${id}.${image.type}`)
    }
    catch (error: any) {
        throw createError({
            statusCode: 500,
            message: `Unable to find image:${id}...\n${error.message}`
        })
    }
})