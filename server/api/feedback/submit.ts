import { queryOne } from "~~/server/database";

export default defineEventHandler(async (event) => {
    const feedback = await readBody(event);
    return await queryOne<any>([
        `CREATE feedback CONTENT ${JSON.stringify(feedback)}`
    ])
})