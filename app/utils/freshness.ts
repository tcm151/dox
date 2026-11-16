import type { AsyncDataRequestStatus } from "#app"
import type { Ref } from "vue"
import { onScopeDispose, watch } from "vue"

export type FreshDataKind = "feed" | "inbox"

interface FreshDatasource {
    kind: FreshDataKind
    userId: () => string
    routePath: () => string
    url: () => string
    status: Ref<AsyncDataRequestStatus>
    refresh: () => Promise<void>
}

interface TrackedFreshDatasource extends FreshDatasource {
    refreshAfterCurrent: boolean
}

const staleAfterMs = 60_000
const datasources = new Set<TrackedFreshDatasource>()
const successfulLoads = new Map<string, number>()
const invalidations = new Map<string, number>()
const activeRefreshes = new Map<string, Promise<void>>()

function datasourceKey(source: FreshDatasource) {
    return `${source.userId()}:${source.kind}:${source.routePath()}:${source.url()}`
}

function invalidationKey(kind: FreshDataKind, userId: string) {
    return `${userId}:${kind}`
}

function isStale(source: FreshDatasource) {
    const key = datasourceKey(source)
    const loadedAt = successfulLoads.get(key) ?? 0
    const invalidatedAt = invalidations.get(invalidationKey(source.kind, source.userId())) ?? 0

    return !loadedAt || Date.now() - loadedAt > staleAfterMs || invalidatedAt > loadedAt
}

function refreshAfterCurrent(source: TrackedFreshDatasource) {
    const key = datasourceKey(source)
    if (!source.refreshAfterCurrent || source.status.value === "pending" || activeRefreshes.has(key)) return

    source.refreshAfterCurrent = false
    void refreshDatasource(source)
}

function refreshDatasource(source: TrackedFreshDatasource): Promise<void> {
    const key = datasourceKey(source)
    const activeRefresh = activeRefreshes.get(key)
    if (activeRefresh) return activeRefresh

    const request = Promise.resolve().then(() => source.refresh()).then(() => {
        if (source.status.value === "success") {
            successfulLoads.set(key, Date.now())
        }
    })
    activeRefreshes.set(key, request)

    const finish = () => {
        if (activeRefreshes.get(key) === request) activeRefreshes.delete(key)
        refreshAfterCurrent(source)
    }
    void request.then(finish, finish)

    return request
}

export function getFreshDataKind(url: string): FreshDataKind | undefined {
    const path = new URL(url, "http://localhost").pathname
    if (path === "/api/profile/notifications") return "inbox"
    if (
        /^\/api\/feed\/(?:pinned|popular|following|search)$/.test(path)
        || /^\/api\/(?:post|thread|link|gallery|audio)$/.test(path)
        || /^\/api\/user\/[^/]+\/feed$/.test(path)
        || /^\/api\/topic\/[^/]+\/(?:feed|pins)$/.test(path)
    ) {
        return "feed"
    }
}

export function getFreshMutationKind(url: string, method = "POST"): FreshDataKind | undefined {
    if (!["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase())) return

    const path = new URL(url, "http://localhost").pathname
    if (
        path === "/api/profile/notifications/dismiss"
        || /^\/api\/profile\/notifications\/[^/]+\/dismiss$/.test(path)
    ) {
        return "inbox"
    }

    if ([
        /^\/api\/(?:post|thread|link)\/(?:add)$/,
        /^\/api\/gallery\/publish$/,
        /^\/api\/(?:post|thread|link|gallery)\/[^/]+\/(?:edit|delete|archive|pin|award|tag\/add|reply)$/,
        /^\/api\/comment\/(?:add|[^/]+\/(?:edit|delete|award))$/,
        /^\/api\/image\/[^/]+\/delete$/,
        /^\/api\/vote\/[^/]+\/(?:positive|misleading|negative|reset)$/,
        /^\/api\/topic\/[^/]+\/(?:update|lock|unlock|follow|unfollow|pins\/add|pins\/[^/]+\/(?:update|delete))$/,
        /^\/api\/user\/[^/]+\/(?:follow|unfollow)$/,
        /^\/api\/admin\/pin\/[^/]+\/(?:update|delete)$/,
        /^\/api\/moderation\/(?:post|thread|link|gallery|comment)\/[^/]+\/(?:lock|slow)\/(?:apply|clear)$/,
        /^\/api\/(?:report\/[^/]+\/(?:resolve|remove|reopen|appeal(?:\/(?:accept|reject))?)|topic\/[^/]+\/reports\/[^/]+\/(?:resolve|remove|reopen|appeal(?:\/(?:accept|reject))?|remove-topic))$/,
    ].some(pattern => pattern.test(path))) {
        return "feed"
    }
}

export function trackFreshDatasource(source: FreshDatasource) {
    const tracked: TrackedFreshDatasource = { ...source, refreshAfterCurrent: false }
    const key = datasourceKey(tracked)
    if (tracked.status.value === "success" && !successfulLoads.has(key)) {
        successfulLoads.set(key, Date.now())
    }

    datasources.add(tracked)
    const stopWatching = watch(tracked.status, (status, previous) => {
        if (status === "success" && previous !== "success") {
            successfulLoads.set(datasourceKey(tracked), Date.now())
        }
        if (status === "success" || status === "error") refreshAfterCurrent(tracked)
    })

    onScopeDispose(() => {
        stopWatching()
        datasources.delete(tracked)
    })

    return () => refreshDatasource(tracked)
}

export function markFreshDataChanged(kind: FreshDataKind, userId: string) {
    invalidations.set(invalidationKey(kind, userId), Date.now())

    for (const source of datasources) {
        if (source.kind !== kind || source.userId() !== userId) continue

        const key = datasourceKey(source)
        if (source.status.value === "pending" || activeRefreshes.has(key)) {
            source.refreshAfterCurrent = true
        }
        else {
            void refreshDatasource(source)
        }
    }
}

export function refreshFreshDataOnNavigation(path: string) {
    for (const source of datasources) {
        if (source.routePath() === path && source.status.value !== "pending" && isStale(source)) {
            void refreshDatasource(source)
        }
    }
}
