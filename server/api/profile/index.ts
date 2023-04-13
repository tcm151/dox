import { User } from "~/types";
import { queryOne, authenticateRequest } from "~/server/database";

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event);
    return await queryOne<User>([`
        SELECT id, name, email, dateCreated, followers, following, topics, admin
        FROM user
        WHERE id = ${auth.id}
    `])
})