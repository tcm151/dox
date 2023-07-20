import fs from "node:fs"
import { Image, User } from "~/types"


export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const { imageId } = event.context.params!
    
    var { sql, parameters } = queryBuilder()
    sql.push('SELECT *')
    sql.push('FROM $image')
    sql.push('FETCH user')
    parameters['image'] = `image:${imageId}`
    const image = await queryOne<Image>({ sql, parameters })


    if ((image.user as User).id !== auth.id) {
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

        var { sql, parameters } = queryBuilder()
        sql.push('UPDATE $user SET')
        sql.push('tokens += $tokens;')
        sql.push('DELETE $image;')
        parameters['user'] = auth.id
        parameters['tokens'] = image.tokens
        parameters['image'] = image.id
        await multiQuery({ sql, parameters })
        
        return true
    }
    catch (error: any) {
        throw createError({
            statusCode: 500,
            message: error.message
        })
    }
})