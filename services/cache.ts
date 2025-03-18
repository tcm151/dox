import type { Ref } from "vue"
import { skipHydrate } from "pinia"

interface Cache {
    [key: string]: any 
}

export const useCache = defineStore("cache", () => {
    const events = useEvents()
    const session = getSession()

    function refreshCache() {
        return useLocalStorage<Cache>(`cache:${session.user.id}`, {})
    }
        
    let cache = refreshCache()
    events.subscribe(Trigger.authenticatedUser, () => cache = refreshCache())
    events.subscribe(Trigger.userLoggedOut, () => cache = refreshCache())

    function get<T>(key: string, fallback: () => T): Ref<T> {
        if (key in cache.value == false) {
            cache.value[key] = fallback()
        }
        
        const cachedRef = ref<T>(cache.value[key]) as Ref<T>
        watch (cachedRef, () => cache.value[key] = cachedRef.value)
        return cachedRef
    }

    function set(key: string, value: any) {
        cache.value[key] = value
    }

    return { cache: skipHydrate(cache), get, set }
})
