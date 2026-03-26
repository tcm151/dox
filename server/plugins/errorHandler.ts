export default defineNitroErrorHandler(async (error, event) => {
    if (error.statusCode) {
        await new DatabaseQuery()
            .addSql(`
                CREATE error SET
                    status = $status,
                    description = $description,
                    stack = $stack,
                    data = $data,
                    user = $user;
            `)
            .addParameter("status", error.statusCode)
            .addParameter("description", error.statusMessage ?? "")
            .addParameter("user", event.context.user ?? "unknown")
            .addParameter("stack", error.stack ?? "")
            .addParameter("data", error.data ?? {})
            .queryOne<Error>()
    }
})