export default defineNitroPlugin(async () => {
    const health = useHealth()

    try {
        health.setStatus("starting")
        const config = useRuntimeConfig()

        await runMigrations()
        await setupDefaultAccount(config.surreal.admin)
        await scheduledTaskManager.start(manager => {
            manager.add(emptyTrash, 60_000)
        })

        health.setStatus("ready")
    }
    catch (error: unknown) {
        health.setStatus("failed")
        health.setFailureReason(error)
        console.error("Application startup failed.", error)
    }
})
