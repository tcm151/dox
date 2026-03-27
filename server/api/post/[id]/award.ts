import type { Post } from "~/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const { id } = event.context.params!

    // TODO need to check that the user has enough tokens
    return await new DatabaseQuery()
        .addSql(`
            RETURN {
                IF $post.user = $awarder {
                    THROW "You cannot award your own posts...";
                };
                IF $post.votes.awards CONTAINS $awarder {
                    THROW "You have already awarded this post.";
                };
                
                UPDATE $post SET
                votes.awards = array::union(votes.awards, [$awarder]);
                
                UPDATE $awarder SET
                tokens -= 256;
                
                UPDATE $post.user SET
                tokens += 256;

                CREATE notification SET
                recipient = $post.user,
                context = $post.id,
                message = $message;

                RETURN SELECT *
                FROM $post;
            };
        `)
        .addRecord("post", `post:${id}`)
        .addRecord("awarder", auth.id)
        .addParameter("message", `**${auth.name}** awarded your post\n> You gained 256 tokens. Don't forget to thank them!\n`)
        .queryOne<Post>()
})