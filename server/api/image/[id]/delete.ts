import fs from "node:fs"
import type { Image } from "@@/shared/types"


export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const { id } = event.context.params!

    const image = await new DatabaseQuery()
        .addSql(`
            SELECT *
            FROM $image
            FETCH user
        `)
        .addRecord("image", `image:${id}`)
        .queryOne<Image>()

    try {
        const path = (ENV.isDevelopment())
            ? `./media/images/${id}.${image.type}`
            : `./.production/media/images/${id}.${image.type}`

        if (fs.existsSync(path)) {
            fs.rmSync(path)
        }

        await new DatabaseQuery()
            .addSql(`
                RETURN {
                    IF $image.user != $user AND $user.roles CONTAINSNOT "admin" {
                        THROW "You are not allowed to do this.";
                    };
                    UPDATE $user SET
                        tokens += $tokens;
                    DELETE $image;
                };
            `)
            .addRecord("user", auth.id)
            .addRecord("image", image.id)
            .addParameter("tokens", image.tokens)
            .execute()

        return true
    }
    catch (error: any) {
        throw createError({
            status: 403,
            statusText: `Unabled to delete image:${id}`,
            message: error.message,
            stack: error.stack,
        })      
    }
})