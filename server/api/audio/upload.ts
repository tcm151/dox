import type { Audio } from "~/types"

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

    // TODO: make this configurable by the admin
    if (data[0].data.byteLength > 100_000_000) {
        return createError({
            statusCode: 400,
            message: "File size exceeds the 100MB limit."
        })
    }

    const { buffer, type } = await processMedia(data![0])
    const tokens = Math.round(buffer.byteLength / 2_048)
    
    if (auth.tokens < tokens) {
        throw createError({
            statusCode: 401,
            message: "You do not have enough tokens to upload this audio."
        })
    }

    const { sql, parameters } = queryBuilder()
    sql.push('RETURN {')
    
    // TODO add event log for all token transactions
    sql.push('UPDATE <record>$user SET')
    sql.push('tokens -= $tokens;')
    parameters['user'] = auth.id

    sql.push('RETURN CREATE audio SET')
    sql.push('user = $user,')
    sql.push('type = $type,')
    sql.push('tokens = $tokens,')
    sql.push('time = time::now(),')
    sql.push(`url = <future> { string::concat("${baseUrl}/cdn/audio/", meta::id(id)) };`)
    parameters['type'] = type
    parameters['tokens'] = tokens

    sql.push('};')

    const audio = await queryOne<Audio>({ sql, parameters })
    await writeMedia(audio, buffer, "audio")
    return { audio, tokens }
})