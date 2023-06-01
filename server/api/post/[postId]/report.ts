import { Post } from "~/types";
import { queryOne } from "../../../database";

export default defineEventHandler(async (event) => {
    const { postId } = event.context.params!
    const auth = await authenticateRequest(event)
    return await queryOne<Post>([`
        CREATE report SET
        subject = post:${postId},
        reporter = ${auth.id},
        time = time::now()
    `])
})