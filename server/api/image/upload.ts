import type { Image, User } from "~/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const data = await readMultipartFormData(event)
    const baseUrl = getHeader(event, 'origin')

    const { buffer, type } = await processImage(data![0])
    const tokens = Math.round(buffer.byteLength / 1_024)
    
    if (auth.tokens >= tokens) {
        var { sql, parameters } = queryBuilder()
        sql.push('UPDATE $user SET')
        sql.push('tokens -= $tokens')
        parameters['user'] = auth.id
        parameters['tokens'] = tokens
        await queryOne<User>({ sql, parameters })
    }
    else {
        throw createError({
            statusCode: 401,
            message: "You do not have enough tokens to upload this image."
        })
    }

    var { sql, parameters } = queryBuilder()
    sql.push('CREATE image SET')
    sql.push('user = $user,')
    sql.push('type = $type,')
    sql.push('tokens = $tokens,')
    sql.push('time = time::now(),')
    sql.push(`url = <future> { string::concat("${baseUrl}/image/", string::split(id, ":")[1]) }`)
    parameters['user'] = auth.id
    parameters['type'] = type
    parameters['tokens'] = tokens
    const image = await queryOne<Image>({ sql, parameters })
    
    await writeToDisk(image, buffer, type)
    return { image, tokens }
})