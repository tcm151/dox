export default defineNitroErrorHandler(async (error, event) => {
    if (error.statusCode) {
        try {
            await new DatabaseQuery()
                .addSql(`
                    CREATE error SET
                        status = $status,
                        description = $description,
                        request = $request,
                        user = $user,
                        stack = $stack,
                        data = $data;
                `)
                .addParameter("status", error.statusCode)
                .addParameter("description", error.statusMessage ?? error.message)
                .addParameter("request", {
                    path: event.path,
                    method: event.method,
                    headers: {
                        host: getHeader(event, "host"),
                        origin: getHeader(event, "origin"),
                        userAgent: getHeader(event, "user-agent"),
                        referer: getHeader(event, "referer"),
                    }
                })
                .addParameter("user", event.context.account.user.id ?? "unknown")
                .addParameter("stack", error.stack ?? "")
                .addParameter("data", error.data ?? {})
                .queryOne<Error>()
        }
        catch (error: any) {
            console.log(error) // unable to write error for some reason
        }
    }
})