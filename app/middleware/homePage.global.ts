import { getRequestURL } from "h3"

export default defineNuxtRouteMiddleware(async (to, from) => {
    if (import.meta.server) {
        const event = useRequestEvent()
        const requestPath = event?.path.split("?")[0] ?? ""
        const isDiagnosticPath = requestPath === "/about"
            || requestPath === "/contact"
            || requestPath === "/feed/home"
            || requestPath === "/feed/threads"
            || requestPath.startsWith("/post/")

        if (event && isDiagnosticPath) {
            const initialUrl = useNuxtApp().ssrContext?.url
            const initialPath = initialUrl ? new URL(initialUrl, "http://nuxt.local").pathname : ""
            const nodeRequestPath = event.node.req.url?.split("?")[0] ?? ""
            const nodeOriginalUrlPath = event.node.req.originalUrl?.split("?")[0] ?? ""
            const matchedRoutePaths = to.matched.map(route => route.path)

            console.warn("[route-diagnostic] SSR URL resolution", JSON.stringify({
                requestId: typeof event.context.requestId === "string" ? event.context.requestId : "unknown",
                requestPath,
                requestUrlPath: getRequestURL(event).pathname,
                nodeRequestPath,
                nodeOriginalUrlPath,
                initialPath,
                routerBase: useRuntimeConfig().app.baseURL,
                resolvedPath: to.path,
                matchedRoutePaths,
            }))
        }
    }

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
