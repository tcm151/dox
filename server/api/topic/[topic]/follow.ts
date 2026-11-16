import { UserSettingsManager } from "@@/server/utils/repos/UserSettingsManager"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const { topic } = event.context.params!

    await UserSettingsManager.isBlocked(auth, `topic:${topic}`)

    return await new DatabaseQuery()
        .addSql(`
            UPDATE $user SET
            topics = array::union(topics, [$topic])
        `)
        .addRecord("user", auth.id)
        .addRecord("topic", `topic:${topic}`)
        .queryOne()
})