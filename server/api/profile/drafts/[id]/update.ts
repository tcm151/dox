import type { Draft } from "@@/shared/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const draft = await readBody<Pick<Draft, "title" | "content" | "topics"> & { tags?: string[] }>(event)
    const { id } = event.context.params!

    return await new DatabaseQuery()
        .addSql(`
            IF $draft.user = $user.id {
                RETURN UPDATE $draft SET
                    title = $title,
                    content = $content,
                    tags = $tags,
                    topics = $topics,
                    time = time::now();
            };
        `)
        .addRecord("draft", `draft:${id}`)
        .addRecord("user", auth.id)
        .addParameter("title", draft.title)
        .addParameter("content", draft.content)
        .addParameter("tags", draft.tags ?? [])
        .addRecords("topics", draft.topics)
        .queryOne<Draft>()
})