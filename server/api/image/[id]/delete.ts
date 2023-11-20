import fs from "node:fs"
import type { Image, User } from "~/types"


export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const { id } = event.context.params!
    
    var { sql, parameters } = queryBuilder()
    sql.push('SELECT *')
    sql.push('FROM $image')
    sql.push('FETCH user')
    parameters['image'] = `image:${id}`
    const image = await queryOne<Image>({ sql, parameters })


    if ((image.user as User).id !== auth.id && !auth.admin) {
        throw createError({
            statusCode: 401,
            message: "You are not allowed to delete this." 
        })
    }

    try {
        switch (process.env.NODE_ENV) {
            case "development":
                const devPath = `./images/${id}.${image.type}`
                if (fs.existsSync(devPath)) {
                    fs.rmSync(devPath)
                }
                break
            case "production":
                const prodPath = `./.production/images/${id}.${image.type}`
                if (fs.existsSync(prodPath)) {
                    fs.rmSync(prodPath)
                }
                break
        }

        // TODO add event log for all token transactions
        var { sql, parameters } = queryBuilder()
        sql.push('BEGIN TRANSACTION;')
        sql.push('UPDATE $user SET')
        sql.push('tokens += $tokens;')
        sql.push('DELETE $image;')
        sql.push('COMMIT TRANSACTION;')
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