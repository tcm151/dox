import { effectScope, ref, type Ref } from "vue"
import { afterEach, describe, expect, it, vi } from "vitest"
import {
    getFreshDataKind,
    getFreshMutationKind,
    markFreshDataChanged,
    refreshFreshDataOnNavigation,
    trackFreshDatasource,
} from "../../app/utils/freshness"

type RequestStatus = "idle" | "pending" | "success" | "error"

function trackSource(
    kind: "feed" | "inbox",
    userId: string,
    routePath: string,
    url: string,
    status: Ref<RequestStatus>,
    refresh: () => Promise<void>,
) {
    const scope = effectScope()
    const trackedRefresh = scope.run(() => trackFreshDatasource({
        kind,
        userId: () => userId,
        routePath: () => routePath,
        url: () => url,
        status,
        refresh,
    }))

    if (!trackedRefresh) throw new Error("Could not register the test datasource.")
    return { scope, refresh: trackedRefresh }
}

afterEach(() => {
    vi.restoreAllMocks()
})

describe("feed and inbox freshness", () => {
    it("tracks only feed and inbox endpoints", () => {
        expect(getFreshDataKind("/api/feed/popular")).toBe("feed")
        expect(getFreshDataKind("/api/profile/notifications")).toBe("inbox")
        expect(getFreshDataKind("/api/topic/available")).toBeUndefined()
    })

    it("classifies relevant writes and ignores reads and unrelated writes", () => {
        expect(getFreshMutationKind("/api/post/add")).toBe("feed")
        expect(getFreshMutationKind("/api/topic/general/lock")).toBe("feed")
        expect(getFreshMutationKind("/api/admin/pin/abc/update")).toBe("feed")
        expect(getFreshMutationKind("/api/report/abc/remove")).toBe("feed")
        expect(getFreshMutationKind("/api/profile/notifications/dismiss")).toBe("inbox")
        expect(getFreshMutationKind("/api/profile/notifications/abc/dismiss")).toBe("inbox")
        expect(getFreshMutationKind("/api/post/add", "GET")).toBeUndefined()
        expect(getFreshMutationKind("/api/feedback/submit")).toBeUndefined()
    })

    it("refreshes only after data is more than 60 seconds old", async () => {
        let now = 1_000_000
        vi.spyOn(Date, "now").mockImplementation(() => now)
        const status = ref<RequestStatus>("success")
        const refresh = vi.fn(async () => {})
        const tracked = trackSource("feed", "threshold-user", "/feed/freshness-threshold", "/api/feed/popular", status, refresh)

        try {
            now += 60_000
            refreshFreshDataOnNavigation("/feed/freshness-threshold")
            await Promise.resolve()
            expect(refresh).not.toHaveBeenCalled()

            now += 1
            refreshFreshDataOnNavigation("/feed/freshness-threshold")
            await vi.waitFor(() => expect(refresh).toHaveBeenCalledTimes(1))
        }
        finally {
            tracked.scope.stop()
        }
    })

    it("coalesces overlapping manual refreshes", async () => {
        const status = ref<RequestStatus>("success")
        let release: (() => void) | undefined
        const refresh = vi.fn(() => new Promise<void>((resolve) => {
            release = resolve
        }))
        const tracked = trackSource("feed", "dedupe-user", "/feed/freshness-dedupe", "/api/feed/popular", status, refresh)

        try {
            const first = tracked.refresh()
            const second = tracked.refresh()
            await vi.waitFor(() => expect(refresh).toHaveBeenCalledTimes(1))
            release?.()
            await Promise.all([first, second])
            expect(refresh).toHaveBeenCalledTimes(1)
        }
        finally {
            tracked.scope.stop()
        }
    })

    it("queues one follow-up refresh for mutations during an active request", async () => {
        const status = ref<RequestStatus>("success")
        let releaseFirst: (() => void) | undefined
        const refresh = vi.fn()
            .mockImplementationOnce(() => {
                status.value = "pending"
                return new Promise<void>((resolve) => {
                    releaseFirst = () => {
                        status.value = "success"
                        resolve()
                    }
                })
            })
            .mockImplementation(async () => {
                status.value = "success"
            })
        const tracked = trackSource("feed", "mutation-user", "/feed/freshness-mutation", "/api/feed/popular", status, refresh)

        try {
            markFreshDataChanged("feed", "mutation-user")
            await vi.waitFor(() => expect(refresh).toHaveBeenCalledTimes(1))
            markFreshDataChanged("feed", "mutation-user")
            markFreshDataChanged("feed", "mutation-user")
            expect(refresh).toHaveBeenCalledTimes(1)

            if (!releaseFirst) throw new Error("The first refresh did not start.")
            releaseFirst()
            await vi.waitFor(() => expect(refresh).toHaveBeenCalledTimes(2))
        }
        finally {
            tracked.scope.stop()
        }
    })

    it("keeps a failed refresh stale so a later navigation can retry", async () => {
        let now = 2_000_000
        vi.spyOn(Date, "now").mockImplementation(() => now)
        const status = ref<RequestStatus>("success")
        const content = ref(["previously loaded"])
        const refresh = vi.fn()
            .mockImplementationOnce(async () => {
                status.value = "error"
            })
            .mockImplementationOnce(async () => {
                status.value = "success"
            })
        const tracked = trackSource("feed", "retry-user", "/feed/freshness-retry", "/api/feed/popular", status, refresh)

        try {
            now += 60_001
            refreshFreshDataOnNavigation("/feed/freshness-retry")
            await vi.waitFor(() => expect(refresh).toHaveBeenCalledTimes(1))
            expect(content.value).toEqual(["previously loaded"])

            refreshFreshDataOnNavigation("/feed/freshness-retry")
            await vi.waitFor(() => expect(refresh).toHaveBeenCalledTimes(2))
            expect(content.value).toEqual(["previously loaded"])
        }
        finally {
            tracked.scope.stop()
        }
    })
})
