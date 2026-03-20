import type { Draft } from "~/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const draft = await readBody(event)
    const { id } = event.context.params!

    return await new DatabaseQuery()
        .addSql(`
            IF $draft.user = $user.id {
                RETURN UPDATE $draft SET
                title = $title,
                content = $content,
                topics = $topics,
                time = time::now();
            };
        `)
        .addRecord("draft", `draft:${id}`)
        .addParameter("user", auth)
        .addParameter("title", draft.title)
        .addParameter("content", draft.content)
        .addParameter("topics", draft.topics)
        .queryOne<Draft>()
})