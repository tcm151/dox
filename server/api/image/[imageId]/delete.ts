import fs from "node:fs"
import { multiQuery, queryOne } from "~/server/database"
import { Image } from "~/types"


export default defineEventHandler(async (event) => {
    const { imageId } = event.context.params!
    const auth = await authenticateRequest(event)
    const image = await queryOne<Image>([`
        SELECT *
        FROM image:${imageId}
        FETCH user
    `])

    if (image.user.id !== auth.id) {
        throw createError({
            statusCode: 401,
            message: "You are not the uploader of this image." 
        })
    }

    try {
        switch (process.env.NODE_ENV) {
            case "development":
                fs.rmSync(`./images/${imageId}.${image.type}`)
                break
            case "production":
                fs.rmSync(`./.production/images/${imageId}.${image.type}`)
                break
        }

        await multiQuery([`
            UPDATE ${auth.id} SET
            tokens += ${image.tokens};

            DELETE image:${imageId};
        `])
        
        return true
    }
    catch (error: any) {
        throw createError({
            statusCode: 500,
            message: error.message
        })
    }
})