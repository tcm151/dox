import { queryAll } from "../../utils/database";

export default defineEventHandler(async (event) => {
    return await queryAll<{ id: string, name: string, score: number }>([`
        SELECT *
        FROM (
            SELECT id, name,
                   array::len(votes.positive)
                   + (array::len(votes.misleading) / 2)
                   - array::len(votes.negative) AS score
            FROM user
        )
        WHERE score > 0
        ORDER BY score DESC
        LIMIT 5
    `])
})