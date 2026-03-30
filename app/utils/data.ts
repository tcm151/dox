import type { NitroFetchRequest, NitroFetchOptions } from "nitropack/types"
import type { UseFetchOptions } from "#app"

export function useDatasource<T>(
    url: string | Ref<string> | (() => string),
    options: UseFetchOptions<T> = {}
) {
    const session = getSession()
    return useFetch(url, {
        deep: true,
        headers: {
            Authorization: session.tokens.access
        },
        ...options
    })
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