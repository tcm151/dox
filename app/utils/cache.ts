import type { Ref } from "vue"
import { skipHydrate } from "pinia"

export const useCache = defineStore("cache", () => {
    const events = useEvents()
    const session = getSession()

    function refresh() {
        return useLocalStorage<Record<string, any>>(`cache:${session.user.id}`, {})
    }
        
    let cache = refresh()
    events.subscribe(Trigger.authenticatedUser, () => cache = refresh())
    events.subscribe(Trigger.userLoggedOut, () => cache = refresh())

    function get<T>(key: string, fallback: () => T): Ref<T> {
        if (key in cache.value == false) {
            cache.value[key] = fallback()
        }
        
        const cachedRef = ref<T>(cache.value[key]) as Ref<T>
        watch (cachedRef, () => cache.value[key] = cachedRef.value)
        return cachedRef
    }

    return { cache: skipHydrate(cache), get }
})