import type { Thread } from "~/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const { content } = await readBody<{ content: string }>(event)
    const { id } = event.context.params!

    return await new DatabaseQuery()
        .addSql(`
            IF $thread.user = $user {
                RETURN UPDATE $thread SET
                    content = $content,
                    edited = true,
                    timeEdited = time::now();
            }
            ELSE {
                THROW "You are not the author of this thread."
            }
        `)
        .addRecord("thread", `thread:${id}`)
        .addRecord("user", auth.id)
        .addParameter("content", content)
        .queryOne<Thread>()
})