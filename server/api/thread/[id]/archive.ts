import type { Thread } from "@@/shared/types"
import { ContentManager } from "@@/server/utils/ContentManager"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, "admin")
    
    const { id } = event.context.params!

    return await ContentManager.archive<Thread>(`thread:${id}`)
})