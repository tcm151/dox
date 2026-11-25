<script setup lang="ts">
const hints = useHints()
const events = useEvents()
const userSettings = useUserSettings()

const { data: filters, refresh } = await useDatasource<{
    muted: Array<{ id: string, name: string }>
    blocked: Array<{ id: string, name: string }>
}>("/api/profile/filters")

const filterAction = ref<string | null>(null)
const contentVisibilityTags = [
    { value: "nsfw", label: "nsfw", tip: "Not safe for work; or sexually explicit content." },
    { value: "spoiler", label: "spoilers", tip: "Content that may spoil things." },
]
const contentVisibilityModes = [
    { value: "show", label: "Show" },
    { value: "mask", label: "Mask" },
    { value: "filter", label: "Filter" },
]

function contentVisibilityMode(tag: string) {
    return userSettings.preferences.content.visibility[tag] ?? "inherit"
}

function updateContentVisibility(tag: string, event: Event) {
    const mode = (event.target as HTMLSelectElement).value
    const preferences = userSettings.preferences.content.visibility
    if (mode === "inherit") {
        delete preferences[tag]
    }
    else if (mode === "show" || mode === "mask" || mode === "filter") {
        preferences[tag] = mode
    }
    else {
        hints.addError("Invalid content visibility option.")
    }
}

async function savePreferences() {
    try {
        if (!await userSettings.save()) return
        hints.addSuccess("Preferences saved successfully.")
    }
    catch (error: any) {
        hints.addError("Failed to save preferences.", error)
    }
}

async function resetPreferences() {
    await userSettings.refresh()
}

function confirmRemoveFilter(action: "unmute" | "unblock", target: { id: string, name: string }) {
    if (filterAction.value !== null) return

    const verb = action === "unmute" ? "unmute" : "unblock"
    const label = action === "unmute" ? "Unmute" : "Unblock"
    events.publish(Trigger.showPopup, {
        title: `${label} ${target.name}?`,
        message: `Are you sure you want to ${verb} ${target.name}?`,
        accept: async () => await removeFilter(action, target.id),
    })
}

async function removeFilter(action: "unmute" | "unblock", target: string) {
    filterAction.value = `${action}:${target}`
    try {
        await useApi(`/api/profile/filters/${action}`, {
            method: "POST",
            body: { target },
        })
        await refresh()
        hints.addSuccess(action === "unmute" ? "Mute removed." : "Block removed.")
    }
    catch (error: any) {
        hints.addError(action === "unmute" ? "Failed to remove mute." : "Failed to remove block.", error)
    }
    finally {
        filterAction.value = null
    }
}

</script>

<template>
    <article class="content-width column g-4 p-4">
        <header class="row wrap inline between g-2">
            <h1>Filters</h1>
            <div class="row wrap g-2">
                <ButtonSpinner class="success" :loading="userSettings.pending" :disabled="userSettings.pending" @click="savePreferences">
                    <i class="fa-solid fa-floppy-disk"></i>
                    <span>Save</span>
                </ButtonSpinner>
                <button class="dark" :disabled="userSettings.loading || userSettings.saving" @click="resetPreferences">
                    <i class="fa-solid fa-rotate"></i>
                    <span>Cancel</span>
                </button>
            </div>
        </header>
        <p v-if="userSettings.loadError" class="negative" role="alert">
            Failed to load preferences. Use Cancel to try again.
        </p>
        <section class="box column p-5">
            <div class="field row center">
                <div class="column f-1">
                    <label>profile audience</label>
                    <span class="tip">Choose who can see your profile details, social information, and feed.</span>
                </div>
                <select class="px-3 py-1" v-model="userSettings.preferences.privacy.profile" :disabled="userSettings.pending">
                    <option value="public">Public</option>
                    <option value="members">Members</option>
                    <option value="private">Private</option>
                </select>
            </div>
            <hr>
            <div v-for="tag in contentVisibilityTags" :key="tag.value" class="field row center">
                <div class="column f-1">
                    <label>{{ tag.label }}</label>
                    <span class="tip">{{ tag.tip }}</span>
                </div>
                <select class="px-2 py-1" :value="contentVisibilityMode(tag.value)" :disabled="userSettings.pending" @change="updateContentVisibility(tag.value, $event)">
                    <option value="inherit">Default</option>
                    <option v-for="mode in contentVisibilityModes" :key="mode.value" :value="mode.value">
                        {{ mode.label }}
                    </option>
                </select>
            </div>
            <hr>
            <template v-if="filters">
                <div class="field g-2">
                    <div class="column f-1">
                        <label class="mb-0">muted</label>
                        <span class="tip">hides content from feeds and search, but doesn't prevent interactions.</span>
                    </div>
                    <div v-if="filters.muted.length" class="muted row wrap g-1">
                        <Tag v-for="target in filters.muted" :key="target.id" class="f-1 b-half" type="link" :label="target.name" @click="confirmRemoveFilter('unmute', target)" />
                    </div>
                </div>
            </template>
            <hr>
            <template v-if="filters">
                <div class="field g-2">
                    <div class="column f-1">
                        <label class="mb-0">blocked</label>
                        <span class="tip">hides content and restrict interactions.</span>
                    </div>
                    <div v-if="filters.blocked.length" class="blocked row wrap g-1">
                        <Tag v-for="target in filters.blocked" :key="target.id" class="f-1 b-half" type="link" :label="target.name" @click="confirmRemoveFilter('unblock', target)" />
                    </div>
                </div>
            </template>
        </section>
    </article>
</template>

<style scoped lang="scss">
section {
    input, select {
        box-sizing: border-box;
        max-width: 10rem;
        width: 100%;
    }
}

div.field:has(+ :not(hr)) {
    margin-bottom: 0.75rem;
}

hr {
    margin-inline: 0;
}
</style>