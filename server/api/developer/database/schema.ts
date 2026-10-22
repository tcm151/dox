export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, "developer")

    const storage = useStorage("assets:server")
    return Buffer.from(await storage.getItem<string>("schema.surql") ?? "").toString()
})