import type { Image } from "@@/shared/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireTrait(auth, "confirmed")

    const media = await processMedia(event, "image")
    
    const image = await new DatabaseQuery()
        .addSql(`
            IF $user.tokens < $tokens {
                fn::http(409, "You do not have enough tokens to upload this image.");
            };

            UPDATE $user SET
                tokens -= $tokens;

            RETURN CREATE image SET
                user = $user,
                type = $type,
                tokens = $tokens,
                origin = $origin;
        `)
        .addTransaction()
        .addRecord('user', auth.id)
        .addParameter('tokens', media.tokens)
        .addParameter('type', media.type)
        .addParameter("origin", useRuntimeConfig().public.baseUrl)
        .queryOne<Image>()

    await writeMedia(auth, image, media.buffer, "image")
    return { media: image, tokens: media.tokens }
})