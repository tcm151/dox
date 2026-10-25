import type { Post } from "@@/shared/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const { id } = event.context.params!

    await new DatabaseQuery()
        .addSql(`
            IF $post.user = $awarder {
                fn::http(400, "You cannot award your own posts...");
            };
            IF $post.votes.awards CONTAINS $awarder {
                fn::http(409, "You have already awarded this post.");
            };
            IF $awarder.tokens < 256 {
                fn::http(409, "You don't have enough tokens.");
            };

            UPDATE $post SET
                votes.awards = array::union(votes.awards, [$awarder]);

            UPDATE $awarder SET
                tokens -= 256;

            UPDATE $post.user SET
                tokens += 256;

            CREATE notification SET
                recipient = $post.user,
                context = $post,
                message = $message;
        `)
        .addTransaction()
        .addRecord("post", `post:${id}`)
        .addRecord("awarder", auth.id)
        .addParameter("message", `**${auth.name}** awarded your post\n> You gained 256 tokens. Don't forget to thank them!\n`)
        .execute()
})