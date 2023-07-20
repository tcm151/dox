import fs from "node:fs"
import { Image } from "~/types"


export default defineEventHandler(async (event) => {
    const { imageId } = event.context.params!
    const image = await queryOne<Image>([`
        SELECT *
        FROM image:${imageId}
        FETCH user
    `])
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