import { scheduledTaskManager } from "../utils/scheduledTasks"

export default defineNitroPlugin((nitroApp) => {
    nitroApp.hooks.hook('close', async () => {
        await scheduledTaskManager.stop()
        await shutdownDatabase()
        console.log("Closed connection to database.")
    })
})