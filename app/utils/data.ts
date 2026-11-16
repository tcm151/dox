import type { NitroFetchRequest, NitroFetchOptions } from "nitropack/types"
import type { UseFetchOptions } from "#app"
import { getFreshDataKind, getFreshMutationKind, markFreshDataChanged, trackFreshDatasource } from "./freshness"

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

    const sourceUrl = () => typeof url === "function" ? url() : unref(url)
    const kind = ENV.isClient() ? getFreshDataKind(sourceUrl()) : undefined
    if (!kind) return datasource

    const route = useRoute()
    const refresh = trackFreshDatasource({
        kind,
        userId: () => session.user.id,
        routePath: () => route.path,
        url: sourceUrl,
        status: datasource.status,
        refresh: () => datasource.refresh({ dedupe: "defer" }),
    })

    return { ...datasource, refresh }
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

export async function useApi<T>(
    url: NitroFetchRequest,
    options: NitroFetchOptions<NitroFetchRequest> = {}
) {
    const session = getSession()
    const response = await $fetch<T>(url, {
        method: "POST",
        headers: {
            Authorization: session.tokens.access
        },
        ...options
    })

    const kind = typeof url === "string" ? getFreshMutationKind(url, options.method) : undefined
    if (kind) markFreshDataChanged(kind, session.user.id)

    return response
}