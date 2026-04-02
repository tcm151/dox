import type { Image } from "@@/shared/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const data = await readMultipartFormData(event)
    const settings = await SettingsManager.get()

    if (!settings.media.images.enabled) {
        return createError({
            status: 503,
            statusText: "Media uploads are currently disabled."
         })
    }

    if (!data || !data[0]) {
        return createError({
            status: 400,
            statusText: "You did pass any files to be uploaded."
        })
    }

    const fileSize = data[0].data.byteLength / 1_048_576
    if (fileSize > settings.media.images.uploadLimit) {
        return createError({
            status: 400,
            statusText: `File size exceeds the ${settings.media.images.uploadLimit}MB limit.`
        })
    }

    const { buffer, type } = await processMedia(data[0])
    const tokens = Math.round(buffer.byteLength / 2_048)
    
    if (auth.tokens < tokens) {
        throw createError({
            status: 401,
            statusText: "You do not have enough tokens to upload this image."
        })
    }

    const image = await new DatabaseQuery()
        .addSql(`
            RETURN {
                UPDATE $user SET
                    tokens -= $tokens;

                RETURN CREATE image SET
                    user = $user,
                    type = $type,
                    tokens = $tokens,
                    origin = $origin;
            };
        `)
        .addRecord('user', auth.id)
        .addParameter('tokens', tokens)
        .addParameter('type', type)
        .addParameter("origin", useRuntimeConfig().public.baseUrl)
        .queryOne<Image>()

    await writeMedia(auth, image, buffer, "image")
    return { media: image, tokens }
})