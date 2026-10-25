import type { NitroFetchRequest, NitroFetchOptions } from "nitropack/types"
import type { UseFetchOptions } from "#app"

export function useDatasource<T>(
    url: string | Ref<string> | (() => string),
    options: UseFetchOptions<T> = {}
) {
    const session = getSession()
    const datasource = useFetch(url, {
        deep: true,
        headers: computed(() => ({
            Authorization: session.tokens.access
        })),
        ...options
    })

    if (options.watch !== false) {
        watch(() => session.user.id, () => datasource.clear(), { flush: "sync" })
    }

    return datasource
}

export function useApi<T>(
    url: NitroFetchRequest,
    options: NitroFetchOptions<NitroFetchRequest> = {}
) {
    const session = getSession()
    return $fetch<T>(url, {
        method: "POST",
        headers: {
            Authorization: session.tokens.access
        },
        ...options
    })
}