export default defineNitroPlugin(async () => {
    const health = useHealth()

    try {
        health.setStatus("starting")
        const config = useRuntimeConfig()

        await runMigrations()
        await setupDefaultAccount(config.surreal.admin)

        health.setStatus("ready")
    }
    catch (error: unknown) {
        health.setStatus("failed")
        console.error("Application startup failed.", error)
    }
})
