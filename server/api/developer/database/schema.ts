export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, "developer")

    let schema = Buffer.from(await useStorage("assets:server").getItem<string>("schema.surql") ?? "").toString()
    let migrations = Buffer.from(await useStorage("assets:server").getItem<string>("migrations.surql") ?? "").toString()
    return [schema, migrations].join("\n\n\n")
})