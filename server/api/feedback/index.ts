import { queryAll } from "~/server/database";
import { Feedback } from "~/types"

export default defineEventHandler(async (event) => {
    return await queryAll<Feedback>([`
        SELECT id, content, time, user.id, user.name
        FROM feedback
        FETCH user 
    `])
})