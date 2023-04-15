import { queryOne } from "../../database";

export default defineEventHandler(async (event) => {
    const error = await readBody(event)
    return await queryOne<any>([`
        CREATE error
        CONTENT ${JSON.stringify(error)}
    `])
})