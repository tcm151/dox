import { multiQuery, queryAll } from "~/server/database"
import { User } from "~/types"

// TODO convert all endpoints to parameterized versions
export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    if (!auth.admin) {
        throw createError({
            statusCode: 401,
            message: "You shall not pass!"
        })
    }
    const responses = await multiQuery([`
        USE NS dox DB backup;
    
        SELECT id, time, user.id, user.name
        FROM backup
        FETCH user;
    `])
    return responses[1].result
})