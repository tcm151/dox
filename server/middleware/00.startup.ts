export default defineEventHandler((event) => {
    const path = event.path.split("?")[0] ?? ""
    const health = useHealth()

    if (path === "/api/health" || health.getStatus() === "ready") {
        return
    }

    setResponseStatus(event, 503, "Service Unavailable")

    if (path === "/unavailable") {
        return
    }

    if (getRequestHeader(event, "accept")?.includes("text/html")) {
        const requestUrl = getRequestURL(event)
        const returnTo = `${requestUrl.pathname}${requestUrl.search}`
        return sendRedirect(event, `/unavailable?returnTo=${encodeURIComponent(returnTo)}`, 303)
    }

    setResponseHeader(event, "content-type", "application/json; charset=utf-8")
    return {
        error: "service_unavailable",
        message: "The application is starting or could not complete startup.",
    }
})