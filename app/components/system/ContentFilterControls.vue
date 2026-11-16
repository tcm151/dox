<script setup lang="ts">
const props = defineProps<{
    target: string
    name: string
}>()

const emit = defineEmits<{
    (event: "refresh"): void
}>()

const session = getSession()
const userSettings = useUserSettings()
const hints = useHints()
const events = useEvents()
const route = useRoute()
const loading = ref(false)

const muted = computed(() => userSettings.preferences.content.filters.muted.includes(props.target))
const blocked = computed(() => userSettings.preferences.content.filters.blocked.includes(props.target))
const unavailable = computed(() => props.target === session.user.id || props.target === "user:deleted")

async function changeFilter(action: "mute" | "unmute" | "block" | "unblock") {
    loading.value = true
    try {
        await useApi(`/api/profile/filters/${action}`, {
            method: "POST",
            body: { target: props.target },
        })
    }
    catch (error: any) {
        hints.addError(`Failed to ${action} ${props.name}.`, error)
        loading.value = false
        return
    }

    hints.addSuccess(action === "mute" || action === "block"
        ? `${props.name} ${action === "mute" ? "muted" : "blocked"}.`
        : `${props.name} ${action === "unmute" ? "unmuted" : "unblocked"}.`)
    emit("refresh")

    try {
        await Promise.all([userSettings.refresh(), session.refreshProfile()])
    }
    catch (error: any) {
        hints.addError("The filter was saved, but your local profile could not be refreshed.", error)
    }

    if (action === "block" && props.target.startsWith("topic:") && route.path === `/topic/${extractId(props.target)}`) {
        await navigateTo("/")
    }
    loading.value = false
}

function toggleBlock() {
    if (blocked.value) {
        void changeFilter("unblock")
        return
    }

    events.publish(Trigger.showPopup, {
        title: `Block ${props.name}?`,
        message: "Blocking removes existing follows in both directions. Unblocking will not restore them.",
        accept: async () => await changeFilter("block"),
    })
}
</script>

<!-- TODO this should function like extra options, with an ellipsis entry point, and then a bunch of user scoped actions -->
<template>
    <div v-if="!unavailable" class="row wrap g-2">
        <ButtonSpinner class="warning small" :loading="loading" :disabled="!userSettings.loaded" @click="changeFilter(muted ? 'unmute' : 'mute')">
            {{ muted ? "Unmute" : "Mute" }}
        </ButtonSpinner>
        <ButtonSpinner class="danger small" :loading="loading" :disabled="!userSettings.loaded" @click="toggleBlock">
            {{ blocked ? "Unblock" : "Block" }}
        </ButtonSpinner>
    </div>
</template>
