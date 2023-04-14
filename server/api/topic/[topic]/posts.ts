import { Post } from "~/types";
import { queryAll } from "../../../database";

export default defineEventHandler(async (event) => {
    const { topic } = event.context.params!;
    return await queryAll<Post>([`
        SELECT *
        FROM post
        WHERE topics CONTAINS topic:${topic}
        FETCH user
    `])
})