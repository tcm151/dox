import type { Audio } from "~/types"

export default defineEventHandler(async (event) => {
    const { fileName } = event.context.params!
    const id = fileName?.split('.').at(0)

    return await new DatabaseQuery()
        .addSql(`
            SELECT id, user.id, user.name, votes, type, tokens, time, url
            FROM $audio
        `)
        .addRecordId("audio", `audio:${id}`)
        .queryOne<Audio>()
})