import fs from "node:fs"
import type { Image } from "@@/shared/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const { id } = event.context.params!

    const image = await new DatabaseQuery()
        .addSql(`
            SELECT *
            FROM $image
        `)
        .addRecord("image", `image:${id}`)
        .queryOne<Image>()

    if (image.user != auth.id && !hasRole(auth, "admin")) {
        throw createError({
            status: 403,
            statusText: `You are not allowed to do this.`,
        })
    }

    // FIXME deletion order is non-atomic; fs and DB state can diverge on partial failure.
    // TODO implement compensation strategy (DB-first with retry queue or rollback-safe file handling).
    try {
        const config = useRuntimeConfig()
        if (fs.existsSync(`${config.media.path}/image/${id}.${image.type}`)) {
            fs.rmSync(`${config.media.path}/image/${id}.${image.type}`)
        }

        await new DatabaseQuery()
            .addSql(`
                RETURN {
                    UPDATE $user SET
                        tokens += $image.tokens;
                    
                    DELETE $image;
                };
            `)
            .addRecord("user", auth.id)
            .addRecord("image", image.id)
            .execute()

        return true
    }
    catch (error: any) {
        throw createError({
            status: 500,
            statusText: `Unable to delete image:${id}`,
            message: error.message,
            stack: error.stack,
        })      
    }
})