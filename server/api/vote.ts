import { queryOne, authenticateRequest } from "../database"

// FIXME can be abused by authenticated user
export default defineEventHandler(async (event) => {
    const { id, votes } = await readBody(event)
    await authenticateRequest(event);
    return await queryOne([`
        UPDATE ${id} SET
        votes = ${JSON.stringify(votes)}
    `])
})
