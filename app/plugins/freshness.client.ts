import { refreshFreshDataOnNavigation } from "@@/app/utils/freshness"

export default defineNuxtPlugin((nuxtApp) => {
    const router = useRouter()
    let historyNavigation = false
    let pendingFreshNavigation: { path: string; startedAt: number } | undefined

    window.addEventListener("popstate", () => {
        historyNavigation = true
    }, true)

    router.afterEach((to, from, failure) => {
        const wasHistoryNavigation = historyNavigation
        historyNavigation = false
        pendingFreshNavigation = !failure && !wasHistoryNavigation && to.path !== from.path
            ? { path: to.path, startedAt: performance.now() }
            : undefined
    })

    nuxtApp.hooks.hook("page:finish", () => {
        const navigation = pendingFreshNavigation
        pendingFreshNavigation = undefined
        if (navigation) refreshFreshDataOnNavigation(navigation.path, navigation.startedAt)
    })
})
