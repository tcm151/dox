import type { UserSettings } from "@@/shared/types"

function defaultSettings(): UserSettings {
    return {
        id: "userSettings:default",
        user: "user:temp" as UserSettings["user"],
        content: {
            visibility: {},
            filters: {
                muted: [],
                blocked: [],
            },
        },
        privacy: { profile: "public" },
        ui: { hoverAnimations: true, hintDuration: 2500 },
        notifications: { inApp: true, email: false },
    }
}

export const useUserSettings = defineStore("user.preferences", () => {
    const events = useEvents()
    const session = getSession()

    const preferences = ref<UserSettings>(defaultSettings())

    const loading = ref(false)
    const loaded = ref(false)
    const saving = ref(false)
    const loadError = ref<unknown>()
    const pending = computed(() => loading.value || !loaded.value || saving.value)
    let generation = 0

    watch(() => preferences.value.ui.hoverAnimations, enabled => {
        if (!ENV.isClient()) return
        document.documentElement.dataset.hoverAnimations = String(enabled)
    }, { immediate: true })

    function isCurrent(userId: string, requestGeneration: number): boolean {
        return requestGeneration === generation
            && session.isAuthenticated
            && session.user.id === userId
    }

    function resetForIdentity(): void {
        generation++
        preferences.value = defaultSettings()
        loading.value = false
        loaded.value = false
        saving.value = false
        loadError.value = undefined
    }

    async function refresh(): Promise<boolean> {
        if (loading.value) return false
        const userId = session.user.id
        const token = session.tokens.access
        if (!session.isAuthenticated || userId === "user:temp" || !token) return false

        const requestGeneration = generation
        loading.value = true
        loadError.value = undefined
        try {
            const result = await useApi<UserSettings>("/api/profile/settings", {
                method: "GET",
                headers: { Authorization: token },
            })
            if (!isCurrent(userId, requestGeneration)) return false
            preferences.value = result
            loaded.value = true
            return true
        }
        catch (error) {
            if (!isCurrent(userId, requestGeneration)) return false
            loadError.value = error
            return false
        }
        finally {
            if (isCurrent(userId, requestGeneration)) loading.value = false
        }
    }

    async function save(): Promise<boolean> {
        const userId = session.user.id
        const token = session.tokens.access
        const requestGeneration = generation
        if (!session.isAuthenticated || userId === "user:temp" || !token) return false
        if (!loaded.value && !await refresh()) return false
        if (!isCurrent(userId, requestGeneration) || saving.value || !loaded.value) return false
        saving.value = true

        try {
            const result = await useApi<UserSettings>("/api/profile/settings/update", {
                method: "PUT",
                headers: { Authorization: token },
                body: preferences.value,
            })
            if (!isCurrent(userId, requestGeneration)) return false
            preferences.value = result
            return true
        }
        catch (error) {
            if (!isCurrent(userId, requestGeneration)) return false
            throw error
        }
        finally {
            if (isCurrent(userId, requestGeneration)) saving.value = false
        }
    }

    watch(
        () => [session.user.id, session.isAuthenticated] as const,
        resetForIdentity,
        { flush: "sync", immediate: true },
    )
    events.subscribe(Trigger.authenticatedUser, () => {
        resetForIdentity()
        void refresh()
    })
    events.subscribe(Trigger.userLoggedOut, resetForIdentity)
    if (session.isAuthenticated && session.user.id !== "user:temp") void refresh()

    return { preferences, loading, loaded, saving, loadError, pending, refresh, save }
})