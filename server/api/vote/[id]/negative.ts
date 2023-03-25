import { queryOne, authenticateRequest } from "../../../database"

// FIXME can be abused by authenticated user
export default defineEventHandler(async (event) => {
    const { id } = event.context.params!;
    const auth = await authenticateRequest(event);
    return await queryOne([`
        UPDATE ${id} SET
        votes.positive -= ${auth.id},
        votes.misleading -= ${auth.id},
        votes.negative = array::union(votes.negative, [${auth.id}])
    `])
})
