export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, "developer")

    return { version: await replayCurrentMigration() }
})