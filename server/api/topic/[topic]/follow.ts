import { UserSettingsManager } from "@@/server/utils/repos/UserSettingsManager"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const { topic } = event.context.params!

    const blockedTopics = await UserSettingsManager.getBlockedTopics(auth)
    if (blockedTopics.includes(`topic:${topic}`)) {
        throw createError({ statusCode: 403, statusMessage: "You cannot follow a topic you have blocked." })
    }

    return await new DatabaseQuery()
        .addSql(`
            UPDATE $user SET
            topics = array::union(topics, [$topic])
        `)
        .addRecord("user", auth.id)
        .addRecord("topic", `topic:${topic}`)
        .queryOne()
})