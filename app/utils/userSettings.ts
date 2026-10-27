import type { UserSettings } from "@@/shared/types"

function defaultSettings(): UserSettings {
    return {
        id: "userSettings:default",
        user: "user:temp" as UserSettings["user"],
        ui: { hoverAnimations: true, hintDuration: 2500 },
        notifications: { inApp: true },
    }
}

export const useUserSettings = defineStore("user.preferences", () => {
    const session = getSession()
    const preferences = ref<UserSettings>(defaultSettings())
    const loading = ref(false)
    const loaded = ref(false)
    const saving = ref(false)

    watch(() => preferences.value.ui.hoverAnimations, enabled => {
        if (!ENV.isClient()) return
        document.documentElement.dataset.hoverAnimations = String(enabled)
    }, { immediate: true })

    async function refresh() {
        if (session.user.id === "user:temp") return

        loading.value = true
        try {
            preferences.value = await useApi<UserSettings>("/api/profile/settings", {
                method: "GET",
            })
            loaded.value = true
        }
        finally {
            loading.value = false
        }
    }

    function get(): UserSettings {
        return preferences.value
    }

    function set(next: UserSettings): void {
        preferences.value = next
    }

    async function save(): Promise<void> {
        if (!loaded.value) await refresh()
        saving.value = true

        try {
            preferences.value = await useApi<UserSettings>("/api/profile/settings/update", {
                method: "PUT",
                body: preferences.value,
            })
        }
        finally {
            saving.value = false
        }
    }

    watch(() => session.user.id, userId => {
        preferences.value = defaultSettings()
        loaded.value = false
        if (userId !== "user:temp") void refresh().catch(() => {})
    }, { immediate: true })

    return { preferences, loading, loaded, saving, get, set, refresh, save }
})