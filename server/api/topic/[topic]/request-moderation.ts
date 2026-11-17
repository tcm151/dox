import { requireTrait } from "~~/shared/utils/traits"
import { SettingsManager } from "@@/server/utils/SettingsManager"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireTrait(auth, "confirmed")
    
    const { topic } = event.context.params!
    const settings = await SettingsManager.get()

    try {
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
    }
    catch (error: any) {
        if (error.statusCode === 409) {
            throw error
        }
        else if (error.message?.includes("index `user_topic` already contains")) {
            throw createError({
                status: 400,
                statusText: "You have already requested to moderate this topic."
            })
        }
        else {
            throw createError({
                status: 500,
                statusText: "Unable to submit moderation request.",
                message: error.message,
                stack: error.stack,
            })
        }
    }
})