<script setup lang="ts">
import type { Comment, Gallery, Link, Post, Thread } from "@@/shared/types"
import { extractId, parseRecordId } from "@@/shared/utils/records"

const hints = useHints()
const session = getSession()

const props = defineProps<{
    target: Post | Thread | Gallery | Link | Comment
    topics?: string[]
}>()

const targetRecord = computed(() => parseRecordId(props.target.id))
const targetType = computed(() => targetRecord.value?.table)
const savedContent = computed(() => ["post", "link", "thread", "gallery"].includes(targetType.value ?? "")
    && props.target.votes.saves.includes(session.user.id))
const targetTopics = computed(() => {
    const topics = targetType.value === "comment"
        ? props.topics ?? []
        : "topics" in props.target
            ? props.target.topics
            : []

    return topics.flatMap((topic) => {
        const record = parseRecordId(topic)
        return record?.table === "topic" ? [topic] : []
    })
})

const actions = computed(() => {
    const isOwner = props.target.user.id === session.user.id
    const isAdmin = hasRole(session.user, "admin")

    const type = targetType.value
    const isLocked = props.target.moderation?.locked
    const isTopicModerator = session.moderatesAny(targetTopics.value)
    const isReply = "replyTo" in props.target && props.target.replyTo !== undefined

    return {
        edit: isOwner && !isLocked,
        delete: isOwner || isAdmin,
        award: !isOwner,
        moderation: {
            lock: isAdmin || isTopicModerator,
            slow: (isAdmin || isTopicModerator) && type !== "comment",
        },
        archive: isAdmin && type !== "comment",
        pin: {
            app: isAdmin && type !== "comment",
            topic: (isAdmin || isTopicModerator) && (type === "post" || type === "gallery" || type === "link" || (type === "thread" && !isReply))
        },
        tag: (isAdmin || isTopicModerator) && (type === "post" || type === "thread" || type === "gallery" || type === "link")
    }
})

const emit = defineEmits<{
    (event: "edit"): void
    (event: "award"): void
    (event: "report"): void
    (event: "delete"): void
    (event: "archive"): void
    (event: "pin"): void
    (event: "close"): void
    (event: "updated"): void
}>()

const emitActions = {
    edit: () => emit("edit"),
    award: () => emit("award"),
    report: () => emit("report"),
    delete: () => emit("delete"),
    archive: () => emit("archive"),
    pin: () => emit("pin"),
}

function emitAndClose(event: keyof typeof emitActions) {
    emitActions[event]()
    emit("close")
}

const settings = useSettings()
const slowModes = computed(() => [...settings.app.moderation.slowModes].sort((left, right) => left - right))
const selectedInterval = ref<number>()
const savingModeration = ref(false)
const savingContent = ref(false)

watch(() => props.target.moderation?.slowed, (slowed) => {
    selectedInterval.value = slowed ?? slowModes.value[0]
}, { immediate: true })

function formatInterval(interval: number) {
    return interval % 60 === 0 ? `${interval / 60}m` : `${interval}s`
}

async function updateLock() {
    const type = targetType.value
    const targetId = targetRecord.value?.id
    if (savingModeration.value || !type || !targetId) return
    savingModeration.value = true
    try {
        if (props.target.moderation?.locked) {
            await useApi(`/api/moderation/${type}/${targetId}/lock/clear`, { method: "POST" })
        }
        else {
            await useApi(`/api/moderation/${type}/${targetId}/lock/apply`, {
                method: "POST",
                body: { scope: "item" },
            })
        }
        emit("updated")
    }
    catch (error: any) {
        hints.addError(error.message, error)
    }
    finally {
        savingModeration.value = false
    }
}

async function setSlowMode() {
    const type = targetType.value
    const targetId = targetRecord.value?.id
    if (savingModeration.value || selectedInterval.value === undefined || !type || !targetId) return
    savingModeration.value = true
    try {
        await useApi(`/api/moderation/${type}/${targetId}/slow/apply`, {
            method: "POST",
            body: { interval: selectedInterval.value },
        })
        emit("updated")
    }
    catch (error: any) {
        hints.addError(error.message, error)
    }
    finally {
        savingModeration.value = false
    }
}

async function clearSlowMode() {
    const type = targetType.value
    const targetId = targetRecord.value?.id
    if (savingModeration.value || !type || !targetId) return
    savingModeration.value = true
    try {
        await useApi(`/api/moderation/${type}/${targetId}/slow/clear`, { method: "POST" })
        emit("updated")
    }
    catch (error: any) {
        hints.addError(error.message, error)
    }
    finally {
        savingModeration.value = false
    }
}

async function toggleSavedContent() {
    if (savingContent.value || !["post", "link", "thread", "gallery"].includes(targetType.value ?? "")) return

    savingContent.value = true
    try {
        await useApi(`/api/vote/${props.target.id}/${savedContent.value ? "unsave" : "save"}`, { method: "POST" })
        hints.addSuccess(savedContent.value ? "Content removed from saved items." : "Content saved.")
        emit("updated")
    }
    catch (error: any) {
        hints.addError("Unable to update saved content.", error)
    }
    finally {
        savingContent.value = false
    }
}

const choosingPin = ref(false)
const pinningTopic = ref<string>()

async function pinToTopic(topic: string) {
    if (!targetRecord.value || pinningTopic.value) return

    pinningTopic.value = topic
    try {
        await useApi(`/api/topic/${extractId(topic)}/pins/add`, { body: { item: props.target.id } })
        hints.addSuccess("Content pinned to topic.")
        emit("updated")
        emit("close")
    }
    catch (error: any) {
        hints.addError("Failed to pin content to topic.", error)
    }
    finally {
        pinningTopic.value = undefined
    }
}

const addingTag = ref(false)
const tags = computed(() => "tags" in props.target ? props.target.tags ?? [] : [])

async function addTag(tag: "nsfw" | "spoiler") {
    if (addingTag.value) return

    addingTag.value = true
    try {
        const record = targetRecord.value
        if (!record || (record.table !== "post" && record.table !== "thread" && record.table !== "gallery" && record.table !== "link")) {
            throw new Error("Tags are only supported on posts, threads, galleries, and links.")
        }

        await useApi(`/api/${record.table}/${record.id}/tag/add`, { body: { tag } })
        hints.addSuccess("Tag added.")
        emit("updated")
    }
    catch (error: any) {
        hints.addError("Failed to add tag.", error)
    }
    finally {
        addingTag.value = false
        emit("close")
    }
}

</script>

<template>
    <Window title="Options" icon="fa-solid fa-list-ul" width="30rem" @close="emit('close')">
        <section class="column g-2">
            <template v-if="actions.pin.app || (actions.pin.topic && targetTopics.length)">
                <button @click="choosingPin = !choosingPin">
                    <i class="fa-solid fa-thumbtack"></i>
                    <span>Pin</span>
                </button>
                <section v-if="choosingPin" class="row wrap fill g-2">
                    <button v-if="actions.pin.app" @click="emitAndClose('pin')">
                        <!-- <i class="fa-solid fa-home"></i> -->
                        <span>Home</span>
                    </button>
                    <template v-if="actions.pin.topic && targetTopics.length">
                        <button v-for="topic in targetTopics" :key="topic" :disabled="pinningTopic !== undefined" @click="pinToTopic(topic)">
                            <!-- <i class="fa-solid fa-tag"></i> -->
                            <span>{{ extractId(topic) }}</span>
                        </button>
                    </template>
                </section>
            </template>
            <div v-if="actions.edit || actions.delete" class="row fill g-2">
                <button v-if="actions.edit" @click="emitAndClose('edit')">
                    <i class="fa-solid fa-eraser"></i>
                    <span>Edit</span>
                </button>
                <button v-if="actions.delete" @click="emitAndClose('delete')">
                    <i class="fa-solid fa-trash-can"></i>
                    <span>Delete</span>
                </button>
            </div>
            <button v-if="actions.award" @click="emitAndClose('award')">
                <i class="fa-solid fa-crown"></i>
                <span>Award</span>
            </button>
            <button v-if="['post', 'link', 'thread', 'gallery'].includes(targetType ?? '')" :disabled="savingContent" @click="toggleSavedContent">
                <i class="fa-solid fa-bookmark"></i>
                <span>{{ savedContent ? "Unsave" : "Save" }}</span>
            </button>
            <button class="report" @click="emitAndClose('report')">
                <i class="fa-solid fa-flag"></i>
                <span>Report</span>
            </button>
            <template v-if="actions.archive">
                <button v-if="target.status === 'active'" @click="emitAndClose('archive')">
                    <i class="fa-solid fa-box-archive"></i>
                    <span>Archive</span>
                </button>
                <button v-if="target.status === 'archived'" @click="emitAndClose('archive')">
                    <i class="fa-solid fa-box-open"></i>
                    <span>Unarchive</span>
                </button>
            </template>
            <section v-if="actions.moderation.lock" class="moderation-controls column g-2">
                <button v-if="!target.moderation?.locked" :disabled="savingModeration" @click="updateLock">
                    <i class="fa-solid fa-lock"></i>
                    <span>Lock</span>
                </button>
                <button v-else :disabled="savingModeration" @click="updateLock">
                    <i class="fa-solid fa-lock-open"></i>
                    <span>Unlock</span>
                </button>

                <div v-if="actions.moderation.slow" class="column g-1">
                    <div v-if="target.moderation?.slowed" class="row g-1">
                        <button class="f-1" :disabled="savingModeration" @click="clearSlowMode">
                            <i class="fa-solid fa-ban"></i>
                            <span>Slowed</span>
                        </button>
                    </div>
                    <template v-else>
                        <div class="row g-2">
                            <button class="f-2 b-0" :disabled="savingModeration || selectedInterval === undefined" @click="setSlowMode">
                                <i class="fa-solid fa-hourglass-half"></i>
                                <span>Slow</span>
                            </button>
                            <label class="field text-center f-1 b-0">
                                <select class="slow-mode-select" v-model.number="selectedInterval" :disabled="savingModeration || slowModes.length === 0">
                                    <option v-for="interval in slowModes" :key="interval" :value="interval">{{ formatInterval(interval) }}</option>
                                </select>
                            </label>
                        </div>
                    </template>
                </div>
            </section>
            <template v-if="actions.tag">
                <div class="row fill g-2">
                    <button v-if="!tags.includes('nsfw')" class="b-0" :disabled="addingTag" @click="addTag('nsfw')">
                        <i class="fa-solid fa-tag"></i>
                        <span>NSFW</span>
                    </button>
                    <button v-if="!tags.includes('spoiler')" class="b-0" :disabled="addingTag" @click="addTag('spoiler')">
                        <i class="fa-solid fa-tag"></i>
                        <span>Spoiler</span>
                    </button>
                </div>
            </template>
        </section>
    </Window>
</template>

<style scoped lang="scss">
.moderation-controls {
    .text-center {
        text-align: center;
    }

    .slow-mode-select {
        text-align: center;
        text-align-last: center;
        justify-content: center;

        &::picker-icon {
            position: static;
            margin-inline-start: 0.375rem;
            padding: 0;
        }

        option {
            text-align: center;
        }
    }
}
</style>
