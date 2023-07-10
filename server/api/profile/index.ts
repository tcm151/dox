import { User } from "~/types";
import { queryOne } from "~/server/database";

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event);
    
    if (!auth) {
        throw createError({
            statusCode: 400,
            statusMessage: "User does not exist."
        })
    }
    
    return await queryOne<User>([`
        SELECT id, name, email, dateCreated,
               followers, following, topics,
               confirmed, verified, admin, tokens
        FROM user
        WHERE id = ${auth.id}
    `])
})