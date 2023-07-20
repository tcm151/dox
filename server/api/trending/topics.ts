import { queryAll } from "../../utils/database";

export default defineEventHandler(async (event) => {
    return await queryAll<{ count: number, topic: string }>([`
        SELECT count(), topic
        FROM (
            SELECT id, topics AS topic
            FROM post
            WHERE time > time::now() -4w
            SPLIT topic
        )
        GROUP BY topic
        ORDER BY count DESC
        LIMIT 5
    `])
})