import type { Image } from "~/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const data = await readMultipartFormData(event)

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

    // TODO make this configurable by the admin
    if (buffer.byteLength > 10_000_000) {
        return createError({
            statusCode: 400,
            message: "File size exceeds the 10MB limit."
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

    await writeMedia(image, buffer, "image")
    return { image, tokens }
})