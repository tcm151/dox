import { Feedback } from "~/types"

export default defineEventHandler(async (event) => {
    return await queryAll<Feedback>([`
        SELECT id, content, time, user.id, user.name
        FROM feedback
        ORDER BY time DESC
        FETCH user 
    `])
})