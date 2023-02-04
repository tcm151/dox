import { queryOne, useDatabase } from "../database"

export default defineEventHandler(async (event) => {
    const { id, votes } = await readBody(event)
    return await queryOne([
        `UPDATE ${id} SET`,
        `votes = ${JSON.stringify(votes)}`,
    ])
})
