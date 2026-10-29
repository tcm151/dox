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
    const hints = useHints()

    watch(datasource.error, (error) => {
        if (error && ENV.isClient()) {
            hints.addError(error.statusMessage ?? error.message, error)
        }
    }, { immediate: true })

    if (options.watch !== false) {
        watch(() => session.user.id, () => datasource.clear(), { flush: "sync" })
    }

    return datasource
}

export function useAuthenticatedDatasource<T>(
    url: string | Ref<string> | (() => string),
    options: Omit<UseFetchOptions<T>, "server"> = {}
) {
    return useDatasource<T>(url, {
        ...options,
        server: false,
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