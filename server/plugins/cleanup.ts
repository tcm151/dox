export default defineNitroPlugin((nitroApp) => {
    nitroApp.hooks.hook('close', async () => {
        await shutdownDatabase()
        console.log("Closed connection to database.")
    })
})