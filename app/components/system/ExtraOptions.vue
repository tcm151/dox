<script setup lang="ts">
import type { Comment, Gallery, Post, Thread } from "@@/shared/types"
import { parseRecordId } from "@@/shared/utils/records"

const session = getSession()
const hints = useHints()

const props = defineProps<{
    target: Post | Thread | Gallery | Comment
}>()

const targetType = computed(() => targetRecord.value?.table)
const targetRecord = computed(() => parseRecordId(props.target.id))
const targetTopics = computed(() => {
    if (!("topics" in props.target)) return []

    return props.target.topics.flatMap((topic) => {
        const record = parseRecordId(topic)
        return record?.table === "topic" ? [record.id] : []
    })
})

const actions = computed(() => {
    const type = targetType.value
    const isOwner = props.target.user.id === session.user.id
    const isAdmin = hasRole(session.user, "admin")
    const isModerator = hasRole(session.user, "moderator")

    return {
        edit: isOwner && (type === "post" || type === "comment"),
        award: type === "post" || type === "thread",
        tag: (isAdmin || isModerator) && (type === "post" || type === "thread" || type === "gallery"),
        archive: (type === "post" && isAdmin) || (type === "gallery" && isAdmin) || (type === "thread" && isAdmin
                && (props.target.status === "active" || props.target.status === "archived")),
        delete: isOwner || (isAdmin && (type === "gallery" || type === "comment")),
        pin: (type === "post" || type === "thread" || type === "gallery") && isAdmin,
        topicPin: (isAdmin || isModerator) && targetTopics.value.length > 0
            && (type === "post" || type === "thread" || type === "gallery"),
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

const choosingPin = ref(false)
const pinningTopic = ref<string>()

async function pinToTopic(topic: string) {
    const record = targetRecord.value
    if (!record || pinningTopic.value) return

    pinningTopic.value = topic
    try {
        await useApi(`/api/topic/${topic}/pins/add`, { body: { item: props.target.id } })
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
        if (!record || (record.table !== "post" && record.table !== "thread" && record.table !== "gallery")) {
            throw new Error("Tags are only supported on posts, threads, and galleries.")
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
    <Window title="Options" icon="fa-solid fa-list-ul" width="25rem" @close="emit('close')">
        <section class="column g-2">
            <template v-if="actions.topicPin || actions.pin">
                <button @click="choosingPin = !choosingPin">
                    <i class="fa-solid fa-thumbtack"></i>
                    <span>Pin</span>
                </button>
                <section v-if="choosingPin" class="row wrap fill g-2">
                    <button v-if="actions.pin" @click="emitAndClose('pin')">
                        <i class="fa-solid fa-home"></i>
                        <span>Home</span>
                    </button>
                    <template v-for="topic in targetTopics" :key="topic">
                        <button :disabled="pinningTopic !== undefined" @click="pinToTopic(topic)">
                            <i class="fa-solid fa-tag"></i>
                            <span>{{ topic }}</span>
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
            <ModerationControls :id="target.id" @updated="emit('updated')" />
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
