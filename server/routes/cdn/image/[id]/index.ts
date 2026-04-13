import fs from "node:fs"
import type { Image } from "@@/shared/types"


export default defineEventHandler(async (event) => {
    const { id } = event.context.params!

    const config = useRuntimeConfig()

    try {
        const image = await new DatabaseQuery()
            .addSql(`
                SELECT *
                FROM $image
                FETCH user
            `)
            .addRecord("image" ,`image:${id}`)
            .queryOne<Image>()

        return fs.readFileSync(`${config.data.path}/image/${id}.${image.type}`)
    }
    catch (error: any) {
        throw createError({
            status: 404,
            statusText: `Unable to find image:${id}.`,
            message: error.message,
            stack: error.stack,
        })
    }
})