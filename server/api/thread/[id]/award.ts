import type { Thread } from "@@/shared/types"
import { ContentManager } from "@@/server/utils/ContentManager"
import { NotificationManager } from "@@/server/utils/repos/NotificationManager"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const { id } = event.context.params!

    const thread = await ContentManager.award<Thread>(`thread:${id}`, auth)

    await NotificationManager.send({
        recipient: thread.user,
        context: thread.id,
        message: `**${auth.name}** awarded your thread\n> You gained 256 tokens. Don't forget to thank them!\n`,
    })

    return thread
})