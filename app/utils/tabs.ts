type RouteTab = {
    route: string
    icon?: string
    label?: string
}

interface TabRouteOptions<T extends RouteTab> {
    key: string
    routePath: string
    defaultTab: string
    startingRoutes: T[]
}

export function useTabRoute<T extends RouteTab>(options: TabRouteOptions<T>) {
    const cache = useCache()
    const router = useRouter()

    const basePath = options.routePath.endsWith("/")
        ? options.routePath.slice(0, -1)
        : options.routePath

    const routes = ref<T[]>(options.startingRoutes)

    function lastTab() {
        return cache.get<string>(options.key, () => options.defaultTab)
    }

    function validateTab(tab: string): string {
        const path = `${basePath}/${tab}`
        if (routes.value.length > 0 && !routes.value.some(r => r.route === path)) {
            return options.defaultTab
        }
        if (!router.getRoutes().some(r => r.path === path)) {
            return options.defaultTab
        }
        return tab
    }

    function getLastTab(): string {
        const current = lastTab()
        const valid = validateTab(current.value)
        if (valid !== current.value) current.value = valid
        return `${basePath}/${current.value}`
    }

    function setLastTab(path: string) {
        const current = lastTab()
        const parts = path.split("/")
        const tab = validateTab(parts[parts.length - 1] ?? options.defaultTab)
        if (tab !== current.value) current.value = tab
    }

    return {
        routes,
        getLastTab,
        setLastTab,
    }
}
