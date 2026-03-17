import type { Image } from "~/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const data = await readMultipartFormData(event)
    const baseUrl = useRuntimeConfig().public.baseUrl

    if (!data || !data[0]) {
        return createError({
            statusCode: 400,
            message: "You did pass any files to be uploaded."
        })
    }

    const { buffer, type } = await processMedia(data[0])
    const tokens = Math.round(buffer.byteLength / 2_048)
    
    if (auth.tokens < tokens) {
        throw createError({
            statusCode: 401,
            message: "You do not have enough tokens to upload this image."
        })
    }

    // TODO: make this configurable by the admin
    if (buffer.byteLength > 10_000_000) {
        return createError({
            statusCode: 400,
            message: "File size exceeds the 10MB limit."
        })
    }

    const { sql, parameters } = queryBuilder()
    sql.push('RETURN {')
    
    // TODO add event log for all token transactions
    sql.push('UPDATE $user SET')
    sql.push('tokens -= $tokens;')
    parameters['user'] = auth.id
    parameters['tokens'] = tokens

    sql.push('RETURN CREATE image SET')
    sql.push('user = $user,')
    sql.push('type = $type,')
    sql.push('tokens = $tokens,')
    sql.push('time = time::now(),')
    sql.push(`url = <future> { string::concat("${baseUrl}/cdn/image/", meta::id(id)) };`)
    parameters['type'] = type

    sql.push('};')

    const image = await queryOne<Image>({ sql, parameters })
    await writeMedia(image, buffer, "image")
    return { image, tokens }
})