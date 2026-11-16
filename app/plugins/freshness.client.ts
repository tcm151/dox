import { refreshFreshDataOnNavigation } from "@@/app/utils/freshness"

export default defineNuxtPlugin((nuxtApp) => {
    const router = useRouter()
    let historyNavigation = false
    let pendingFreshPath: string | undefined

    window.addEventListener("popstate", () => {
        historyNavigation = true
    }, true)

    router.afterEach((to, from, failure) => {
        const wasHistoryNavigation = historyNavigation
        historyNavigation = false
        pendingFreshPath = !failure && !wasHistoryNavigation && to.path !== from.path
            ? to.path
            : undefined
    })

    nuxtApp.hooks.hook("page:finish", () => {
        const path = pendingFreshPath
        pendingFreshPath = undefined
        if (path) refreshFreshDataOnNavigation(path)
    })
})
