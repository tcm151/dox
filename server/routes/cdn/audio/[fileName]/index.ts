import fs from "node:fs"
import type { Audio } from "~/types"


export default defineEventHandler(async (event) => {
    const { fileName } = event.context.params!
    const id = fileName?.split('.').at(0)

    try {
        const audio = await new DatabaseQuery()
            .addSql(`
                SELECT *
                OMIT user.password
                FROM $audio
                FETCH user
            `)
            .addRecord("audio" ,`audio:${id}`)
            .queryOne<Audio>()

        return fs.readFileSync(`./media/audio/${id}.${audio.type}`)
    }
    catch (error: any) {
        throw createError({
            status: 404,
            statusText: `Unable to find audio:${id}.`,
            message: error.message,
            stack: error.stack,
        })
    }
})