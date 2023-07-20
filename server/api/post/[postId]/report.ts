import { Post } from "~/types";

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    
    const { postId } = event.context.params!
    return await queryOne<Post>([`
        CREATE report SET
        subject = post:${postId},
        reporter = ${auth.id},
        time = time::now()
    `])
})