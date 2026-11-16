import { ContentManager } from "@@/server/utils/ContentManager"
import { NotificationManager } from "@@/server/utils/repos/NotificationManager"

export default defineEventHandler(async (event) => {
    const awarder = await authenticateRequest(event)
    const { id } = event.context.params!

    const target = await ContentManager.award(`comment:${id}`, awarder)

    await NotificationManager.send({
        recipient: target.user,
        context: `comment:${id}`,
        message: `**${awarder.name}** awarded your comment\n> You gained 256 tokens. Don't forget to thank them!\n`,
    })
})