import { authenticateRequest, queryOne } from "~~/server/database";

export default defineEventHandler(async (event) => {
    const feedback = await readBody(event);
    await authenticateRequest(event);
    return await queryOne<any>([
        `CREATE feedback CONTENT ${JSON.stringify(feedback)}`
    ])
})