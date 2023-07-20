export default defineEventHandler(async (event) => {
    return await queryAll<{ subject: string, reporter: string, time?: string }>([`
        SELECT *
        FROM report
        // FETCH subject, reporter
        ORDER BY time DESC
    `])
})