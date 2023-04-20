import { queryAll } from "~/server/database";
import { User } from "~/types"

interface Feedback {
    id: string
    user: User
    time: string
    content: string
}

export default defineEventHandler(async (event) => {
    return await queryAll<Feedback>([`
        SELECT id, content, time, user.id, user.name
        FROM feedback
        FETCH user 
    `])
})