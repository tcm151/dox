import type { Audio } from "@@/shared/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireTrait(auth, "confirmed")

    const media = await processMedia(event, "audio")

    const audio = await new DatabaseQuery()
        .addSql(`
            IF $user.tokens < $tokens {
                fn::http(409, "You do not have enough tokens to upload this audio.");
            };

            UPDATE $user SET
                tokens -= $tokens;

            RETURN CREATE audio SET
                user = $user,
                type = $type,
                tokens = $tokens,
                time = time::now(),
                origin = $origin;
        `)
        .addTransaction()
        .addRecord('user', auth.id)
        .addParameter('type', media.type)
        .addParameter('tokens', media.tokens)
        .addParameter("origin", useRuntimeConfig().public.baseUrl)
        .queryOne<Audio>()
        
    await writeMedia(auth, audio, media.buffer, "audio")
    return { media: audio, tokens: media.tokens }
})