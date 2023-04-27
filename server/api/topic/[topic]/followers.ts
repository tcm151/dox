import { queryOne } from "../../../database";

export default defineEventHandler(async (event) => {
    const { topic } = event.context.params!;
    return await queryOne<{ count: number }>([`
        SELECT count(topics CONTAINS topic:${topic})
        FROM user
        GROUP ALL
    `])
})