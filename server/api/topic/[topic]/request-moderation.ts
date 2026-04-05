import { requireTrait } from "~~/shared/utils/traits"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireTrait(auth, "confirmed")
    
    const { topic } = event.context.params!

    try {
        await new DatabaseQuery()
            .addSql(`
                CREATE moderationRequest SET
                    topic = $topic,
                    user = $user;
            `)
            .addRecord("topic", `topic:${topic}`)
            .addRecord("user", auth.id)
            .execute()
    }
    catch (error: any) {
        if (error.message?.includes("index `user_topic` already contains")) {
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