import fs from "node:fs"
import { Image } from "~/types"


export default defineEventHandler(async (event) => {
    const { imageId } = event.context.params!

    var { sql, parameters } = queryBuilder()
    sql.push('SELECT *')
    sql.push('FROM $image')
    sql.push('FETCH user')
    parameters['image'] = `image:${imageId}`
    const image = await queryOne<Image>({ sql, parameters })
    
    try {
        return fs.readFileSync(`./images/${imageId}.${image.type}`)
    }
    catch (error: any) {
        throw createError({
            statusCode: 500,
            message: `Unable to find image:${imageId}...\n${error.message}`
        })
    }
})