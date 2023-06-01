import { queryAll } from "~/server/database";

export default defineEventHandler(async (event) => {
    return await queryAll<{ subject: string, reporter: string }>([`
        SELECT *
        FROM report
        // FETCH subject, reporter
    `])
})