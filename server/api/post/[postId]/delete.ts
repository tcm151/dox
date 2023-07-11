import { multiQuery, queryOne } from "~/server/database";
import { Post } from "types"

export default defineEventHandler(async (event) => {
    const { postId } = event.context.params!;
    const auth = await authenticateRequest(event);
    
    let post = await queryOne<Post>([`
        SELECT *
        FROM post:${postId}
        FETCH images
    `])
    
    if (post.user === auth.id) {
        var sql = new Array<string>()
        
        post.topics.forEach(topic => {
            sql.push(`UPDATE ${topic} SET posts -= ${post.id};`)
        })
        
        post.images?.forEach(image => {
            if (image.user == auth.id) {
                sql.push(`UPDATE ${auth.id} SET tokens += ${image.tokens};`)
                sql.push(`DELETE ${image.id};`)
            }
        })

        sql.push(`DELETE ${post.id}`)
        
        return await multiQuery(sql)
    }
})