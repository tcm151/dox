import fs from "node:fs"
import type { Image } from "~/types"


export default defineEventHandler(async (event) => {
    const { id } = event.context.params!

    try {
        const image = await new DatabaseQuery()
            .addSql(`
                SELECT *
                OMIT user.password
                FROM $image
                FETCH user
            `)
            .addRecord("image" ,`image:${id}`)
            .queryOne<Image>()

        return fs.readFileSync(`./media/image/${id}.${image.type}`)
    }
    catch (error: any) {
        throw createError({
            statusCode: 500,
            message: `Unable to find image:${id}...\n${error.message}`
        })
    }
})