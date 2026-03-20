import fs from "node:fs"
import type { Image, User } from "~/types"


export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const { id } = event.context.params!

    const image = await new DatabaseQuery()
        .addSql(`
            SELECT *
            FROM $image
            FETCH user
        `)
        .addRecordId("image", `image:${id}`)
        .queryOne<Image>()

    if ((image.user as User).id !== auth.id && !hasRole(auth, "admin")) {
        throw createError({
            statusCode: 401,
            message: "You are not allowed to delete this." 
        })
    }

    if (ENV.isDevelopment()) {
        const devPath = `./media/images/${id}.${image.type}`
        if (fs.existsSync(devPath)) {
            fs.rmSync(devPath)
        }
    }
    else {
        const prodPath = `./.production/media/images/${id}.${image.type}`
        if (fs.existsSync(prodPath)) {
            fs.rmSync(prodPath)
        }
    }

    await new DatabaseQuery()
        .addSql(`
            BEGIN TRANSACTION;

            UPDATE $user SET
            tokens += $tokens;

            DELETE $image;

            COMMIT TRANSACTION;
        `)
        .addRecordId("user", auth.id)
        .addRecordId("image", image.id)
        .addParameter("tokens", image.tokens)
        .execute()
    
    return true
})