import { Post } from "~/types";

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event);
    
    const post = await readBody(event)
    post.user = auth.id;
    post.votes.positive = [auth.id]

    const createdPost = await queryOne<Post>([`
        CREATE post
        CONTENT ${JSON.stringify(post)}
    `])

    let sql = new Array<string>()
    post.topics.forEach((t: string) => {
        sql.push(`UPDATE ${t} SET posts += "${createdPost.id}";`)
    })
    await multiQuery(sql)

    return createdPost
})