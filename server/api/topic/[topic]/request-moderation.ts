import { requireTrait } from "~~/shared/utils/traits"
import { SettingsManager } from "@@/server/utils/SettingsManager"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireTrait(auth, "confirmed")
    
    const { topic } = event.context.params!
    const settings = await SettingsManager.get()

    await new DatabaseQuery()
        .addSql(`
            IF $topic.moderators.len() >= $perTopic {
                fn::http(409, "This topic is not accepting additional moderator requests.");
            };

            CREATE moderationRequest SET
                topic = $topic,
                user = $user;
        `)
        .addTransaction()
        .addRecord("topic", `topic:${topic}`)
        .addRecord("user", auth.id)
        .addParameter("perTopic", settings.moderation.perTopic)
        .execute()
})