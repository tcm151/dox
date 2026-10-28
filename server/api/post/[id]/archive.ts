import type { Post } from "@@/shared/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, ["admin", "developer"])
    
    const { id } = event.context.params!

    return await new DatabaseQuery()
        .addSql(`
            IF $post.status NOT IN ["active", "archived"] {
                fn::http(409, "This post cannot be archived in its current state.");
            };
            UPDATE $post SET
                status = IF status = "archived" THEN "active" ELSE "archived" END
        `)
        .addRecord("post", `post:${id}`)
        .queryOne<Post>()
})