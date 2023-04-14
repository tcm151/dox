import { queryOne } from "../../../database";

export default defineEventHandler(async (event) => {
    const { topic } = event.context.params!;
    return await queryOne<{ count: number }>([`
        SELECT count()
        FROM user
        WHERE topics CONTAINS topic:${topic}
        GROUP BY count
    `]) ?? { count: 0 }
})