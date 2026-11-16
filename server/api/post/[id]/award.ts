import { ContentManager } from "@@/server/utils/ContentManager"
import { NotificationManager } from "@@/server/utils/repos/NotificationManager"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const { id } = event.context.params!

    const target = await ContentManager.award(`post:${id}`, auth)

    await NotificationManager.send({
        recipient: target.user,
        context: `post:${id}`,
        message: `**${auth.name}** awarded your post\n> You gained 256 tokens. Don't forget to thank them!\n`,
    })
})