export interface TabItem {
    route: string
    label: string
    icon: string
    hide?: () => boolean
}

interface UseLastTabOptions {
    base: string
    default: string
}

export const useLastTab = (options: UseLastTabOptions) => {
    const cache = useCache()
    const router = useRouter()
    
    function getLastTab() {
        const lastTab = cache.get(`${options.base}.lastTab`, () => options.default)
        const path = `/${options.base}/${lastTab.value}`
        if (router.getRoutes().some(r => r.path === path)) {
            return path
        }
        else {
            return `/${options.base}/${options.default}`
        }
    }

    function setLastTab(path: string) {
        const parts = path.split("/")
        const lastTab = parts[parts.length-1] ?? options.default
        if (router.getRoutes().some(r => r.path === `/${options.base}/${lastTab}`)) {
            cache.set(`${options.base}.lastTab`, lastTab)
        }
        else {
            cache.set(`${options.base}.lastTab`, options.default)
        }
    }

    return {
        getLastTab,
        setLastTab,
    }
}