import type { UseFetchOptions } from "#app"
import type { FeedPage } from "@@/shared/types"
import { computed, ref, toValue, watch, type MaybeRefOrGetter } from "vue"

type FeedDatasourceOptions<T> = Pick<UseFetchOptions<FeedPage<T>>, "query"> & {
    sorting?: boolean
}

export function useFeedDatasource<T extends { id: string }>(
    endpoint: MaybeRefOrGetter<string>,
    options: FeedDatasourceOptions<T> = {},
) {
    const { query: queryOptions, sorting = false } = options
    const sortBy = useCache().get<string>("feed.sort", () => "new")

    const query = computed(() => ({
        pageSize: 20,
        offset: 0,
        ...(toValue(queryOptions) ?? {}),
        ...(sorting ? { sortBy: sortBy.value } : {}),
    }))

    const page = useDatasource<FeedPage<T>>(endpoint, { query })

    const hints = useHints()
    const loading = ref(false)
    const data = computed(() => page.data.value?.items)
    const more = computed(() => page.data.value?.more ?? false)
    watch(() => toValue(endpoint), () => page.clear(), { flush: "sync" })

    async function loadMore() {
        const currentPage = page.data.value
        if (!currentPage?.more || loading.value || page.status.value === "pending") return

        const requestUrl = toValue(endpoint)
        const requestQuery = query.value
        loading.value = true
        try {
            const nextPage = await $fetch<FeedPage<T>>(requestUrl, {
                headers: { Authorization: getSession().tokens.access },
                query: {
                    ...requestQuery,
                    pageSize: currentPage.pageSize,
                    offset: currentPage.offset + currentPage.pageSize,
                },
            })

            if (
                requestUrl !== toValue(endpoint)
                || requestQuery !== query.value
                || currentPage !== page.data.value
            ) return

            const seenIds = new Set(currentPage.items.map(item => item.id))
            const items = [...currentPage.items]
            for (const item of nextPage.items) {
                if (seenIds.has(item.id)) continue
                seenIds.add(item.id)
                items.push(item)
            }

            page.data.value = { ...nextPage, items }
        }
        catch (error) {
            hints.addError(
                error instanceof Error ? error.message : "Unable to load more feed items.",
                error,
            )
        }
        finally {
            loading.value = false
        }
    }

    function setSort(type: string) {
        sortBy.value = type
    }

    return {
        data,
        status: page.status,
        pending: page.pending,
        refresh: page.refresh,
        loading,
        more,
        loadMore,
        sortBy,
        sorting,
        setSort,
    }
}

export type FeedDatasource<T extends { id: string }> = ReturnType<typeof useFeedDatasource<T>>
