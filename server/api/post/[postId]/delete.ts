import { multiQuery, queryOne } from "~/server/database";

export default defineEventHandler(async (event) => {
    const { postId } = event.context.params!;
    const auth = await authenticateRequest(event);
    let post = await queryOne<any>([`
        SELECT *
        FROM post:${postId}
    `])
    if (post.user === auth.id) {
        var sql = new Array<string>()
        post.topics.forEach((t: string) => {
            sql.push(`UPDATE ${t} SET posts -= ${post.id};`)
        })
        sql.push(`DELETE ${post.id}`)
        return await multiQuery(sql)
    }
})