import type { Audio } from "~/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const data = await readMultipartFormData(event)

    const settings = await useSettings()

    if (!settings.media.uploads.enabled) {
        return createError({
            statusCode: 503,
            message: "Media uploads are currently disabled."
         })
    }

    if (!data || !data[0]) {
        return createError({
            statusCode: 400,
            message: "You did pass any files to be uploaded."
        })
    }

    const fileSize = data[0].data.byteLength / 1_048_576
    if (fileSize > settings.media.uploads.audioMaxSize) {
        return createError({
            statusCode: 400,
            message: `File size exceeds the ${settings.media.uploads.audioMaxSize}MB limit.`
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

    const audio = await new DatabaseQuery()
        .addSql(`
            RETURN {
                UPDATE $user SET
                tokens -= $tokens;

                RETURN CREATE audio SET
                user = $user,
                type = $type,
                tokens = $tokens,
                time = time::now(),
                origin = $origin;
            };
        `)
        .addRecord('user', auth.id)
        .addParameter('type', type)
        .addParameter('tokens', tokens)
        .addParameter("origin", useRuntimeConfig().public.baseUrl)
        .queryOne<Audio>()
        
    await writeMedia(auth, audio, buffer, "audio")
    return { audio, tokens }
})