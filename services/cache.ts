import type { Ref } from "vue"
import { defineStore } from "pinia"

interface Cache {
    [key: string]: any 
}

export const useCache = defineStore("cache", () => {
    const events = useEvents()
    const session = getSession()

    let cache = ref<Cache>({})
    events.subscribe(Trigger.authenticatedUser, () => {
        cache = useLocalStorage<Cache>(`cache:${session.user.id}`, {})
    })

    function get<T>(key: string, fallback?: () => T): Ref<T> {
        // WARN potential for performance degradations here
        if (cache.value[key] != undefined) {
            const cachedRef = ref<T>(cache.value[key]) as Ref<T>
            watch (cachedRef, () => cache.value[key] = cachedRef.value)
            return cachedRef
        }
        else if (fallback) {
            cache.value[key] = fallback()
            const fallbackRef = ref<T>(cache.value[key]) as Ref<T>
            watch (fallbackRef, () => cache.value[key] = fallbackRef.value)
            return fallbackRef
        }
        else {
            throw createError({
                fatal: true,
                statusCode: 404,
                message: "This value was not cached, and no fallback was provided."
            })
        }
    }

    function set(key: string, value: any) {
        cache.value[key] = value
    }

    return { get, set }
})
