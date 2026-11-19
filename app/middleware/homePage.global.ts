export default defineNuxtRouteMiddleware(async (to, from) => {
    if (to.fullPath === '/') {
        if (import.meta.server) {
            const event = useRequestEvent()
            const requestPath = event?.path.split("?")[0] ?? ""
            if (event && requestPath !== "/") {
                const requestId = typeof event.context.requestId === "string"
                    ? event.context.requestId
                    : "unknown"
                console.warn("[route-diagnostic] root redirect on non-root request", JSON.stringify({
                    requestId,
                    method: event.method,
                    requestPath,
                    resolvedPath: to.path,
                }))
            }
        }
        return navigateTo("/feed")
    }
})
