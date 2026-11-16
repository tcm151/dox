<script setup lang="ts">
import type { Topic, User } from "@@/shared/types"

const props = defineProps<{
    target: User | Topic
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
const showOptions = ref(false)

const targetId = computed(() => props.target.id)
const isUser = computed(() => targetId.value.startsWith("user:"))
const saved = computed(() => isUser.value && props.target.votes.saves.includes(session.user.id))
const awarded = computed(() => isUser.value && props.target.votes.awards.includes(session.user.id))
const muted = computed(() => userSettings.preferences.content.filters.muted.includes(targetId.value))
const blocked = computed(() => userSettings.preferences.content.filters.blocked.includes(targetId.value))
const unavailable = computed(() => targetId.value === session.user.id || targetId.value === "user:deleted")

async function changeFilter(action: "mute" | "unmute" | "block" | "unblock") {
    if (loading.value || userSettings.pending) return

    loading.value = true
    try {
        await useApi(`/api/profile/filters/${action}`, {
            method: "POST",
            body: { target: targetId.value },
        })
    }
    catch (error: any) {
        hints.addError(`Failed to ${action} ${props.name}.`, error)
        loading.value = false
        return
    }

    const successMessages = {
        mute: `${props.name} muted.`,
        unmute: `${props.name} unmuted.`,
        block: `${props.name} blocked.`,
        unblock: `${props.name} unblocked.`,
    }
    hints.addSuccess(successMessages[action])
    emit("refresh")

    try {
        await Promise.all([userSettings.refresh(), session.refreshProfile()])
    }
    catch (error: any) {
        hints.addError("The filter was saved, but your local profile could not be refreshed.", error)
    }

    if (action === "block" && targetId.value.startsWith("topic:") && route.path === `/topic/${extractId(targetId.value)}`) {
        await navigateTo("/")
    }
    loading.value = false
}

async function updateSaved(action: "save" | "unsave") {
    if (!isUser.value || loading.value || userSettings.pending) return

    loading.value = true
    try {
        await useApi(`/api/user/${extractId(targetId.value)}/${action}`)
        if (action === "unsave") hints.addSuccess("User removed from saved subscriptions.")
        else hints.addSuccess("User saved as a subscription.")
        emit("refresh")
    }
    catch (error: any) {
        hints.addError("Unable to update this saved subscription.", error)
    }
    finally {
        loading.value = false
    }
}

function awardUser() {
    if (!isUser.value || loading.value || userSettings.pending) return
    showOptions.value = false

    if (awarded.value) {
        hints.addWarning("You have already awarded this user.")
        return
    }
    if (session.user.tokens < 256) {
        hints.addWarning("You do not have enough tokens to award this user.")
        return
    }

    events.publish(Trigger.showPopup, {
        title: "Confirm Award",
        message: "Are you sure you want to award this user? It will cost 256 tokens.",
        accept: async () => {
            loading.value = true
            try {
                await useApi(`/api/user/${extractId(targetId.value)}/award`)
                await session.refreshProfile()
                hints.addSuccess("Successfully awarded user.")
                emit("refresh")
            }
            catch (error: any) {
                hints.addError("Unable to award this user.", error)
            }
            finally {
                loading.value = false
            }
        },
    })
}

function muteTarget() {
    showOptions.value = false
    void changeFilter("mute")
}

function unmuteTarget() {
    showOptions.value = false
    void changeFilter("unmute")
}

function reportTarget() {
    showOptions.value = false
    submitReport(targetId.value)
}

function blockTarget() {
    showOptions.value = false
    events.publish(Trigger.showPopup, {
        title: `Block ${props.name}?`,
        message: "Blocking removes existing follows in both directions. Unblocking will not restore them.",
        accept: async () => await changeFilter("block"),
    })
}

function unblockTarget() {
    showOptions.value = false
    void changeFilter("unblock")
}
</script>

<template>
    <div v-if="!unavailable" class="row wrap g-2">
        <button type="button" class="small" title="Actions" aria-label="Actions" :disabled="loading || userSettings.pending" @click="showOptions = true">
            <i class="fa-solid fa-ellipsis"></i>
        </button>
    </div>
    <ClientOnly>
        <OverlayTransition>
            <Window v-if="!unavailable && showOptions" title="Options" icon="fa-list-ul" width="24rem" @close="showOptions = false">
                <section class="column g-2">
                    <template v-if="isUser">
                        <button v-if="!saved" type="button" :disabled="loading || userSettings.pending" @click="updateSaved('save')">
                            <i class="fa-solid fa-bookmark"></i>
                            <span>Save</span>
                        </button>
                        <button v-else type="button" :disabled="loading || userSettings.pending" @click="updateSaved('unsave')">
                            <i class="fa-solid fa-bookmark"></i>
                            <span>Unsave</span>
                        </button>
                        <button v-if="!awarded" type="button" :disabled="loading || userSettings.pending" @click="awardUser">
                            <i class="fa-solid fa-crown"></i>
                            <span>Award</span>
                        </button>
                        <button v-else type="button" :disabled="loading || userSettings.pending">
                            <i class="fa-solid fa-crown"></i>
                            <span>Awarded</span>
                        </button>
                    </template>
                    <button v-if="!muted" type="button" :disabled="loading || userSettings.pending" @click="muteTarget">
                        <i class="fa-solid fa-volume-xmark"></i>
                        <span>Mute</span>
                    </button>
                    <button v-else type="button" :disabled="loading || userSettings.pending" @click="unmuteTarget">
                        <i class="fa-solid fa-volume-high"></i>
                        <span>Unmute</span>
                    </button>
                    <button v-if="!blocked" type="button" :disabled="loading || userSettings.pending" @click="blockTarget">
                        <i class="fa-solid fa-ban"></i>
                        <span>Block</span>
                    </button>
                    <button v-else type="button" :disabled="loading || userSettings.pending" @click="unblockTarget">
                        <i class="fa-solid fa-lock-open"></i>
                        <span>Unblock</span>
                    </button>
                    <button type="button" :disabled="loading || userSettings.pending" @click="reportTarget">
                        <i class="fa-solid fa-flag"></i>
                        <span>Report</span>
                    </button>
                </section>
            </Window>
        </OverlayTransition>
    </ClientOnly>
</template>
