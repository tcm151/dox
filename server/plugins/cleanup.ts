import { scheduledTaskManager } from "@@/server/utils/ScheduledTaskManager"
import { DatabaseQuery } from "@@/server/utils/DatabaseQuery"

export default defineNitroPlugin((nitroApp) => {
    nitroApp.hooks.hook('close', async () => {
        await scheduledTaskManager.stop()
        await DatabaseQuery.shutdown()
        console.log("Closed connection to database.")
    })
})