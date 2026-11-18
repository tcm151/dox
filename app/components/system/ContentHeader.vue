<script setup lang="ts">
import type { Gallery, Image, Link, Post, Thread } from "@@/shared/types"

type ContentHeaderItem = Post | Link | Thread | Gallery | Image

const props = defineProps<{
    content: ContentHeaderItem
    pinned?: boolean
}>()

const thread = computed(() => "replies" in props.content ? props.content : undefined)
const topics = computed(() => "topics" in props.content ? props.content.topics : [])
const moderation = computed(() => "moderation" in props.content ? props.content.moderation : undefined)
const archived = computed(() => props.content.status === "archived")
const quarantined = computed(() => props.content.status === "quarantined")
const awards = computed(() => props.content?.votes.awards.length)
const saves = computed(() => props.content?.votes.saves.length)
const images = computed(() => "images" in props.content ? props.content.images.length : undefined)
const edited = computed(() => "edited" in props.content && props.content.edited ? props.content.timeEdited : undefined)

const readableTime = computed(() => props.content.time.split(".")[0]?.replace("T", " "))

// TODO could be remove and replaced with table name
const moderationType = computed(() => thread.value ? "thread" : "discussion")

const responses = computed(() => {
    if ("replies" in props.content) return props.content.replies.length
    if ("comments" in props.content) return props.content.comments.length
    return 0
})

</script>

<template>
    <header class="row fill wrap g-1">
        <div class="row wrap g-1">
            <Votes :target="content" />
            <template v-if="topics.length">
                <TopicTag v-for="topic in topics" class="f-3 b-0" :key="topic" :topic="topic" />
            </template>
        </div>
        <div class="row wrap g-1">
            <UserTag v-if="content.user" class="f-2 b-0" :user="content.user" />
            <Tag v-if="pinned" class="meta" icon="fa-thumbtack" title="Pinned" />
            <Tag v-if="archived" class="meta" icon="fa-folder-closed" title="Archived" />
            <Tag v-if="awards" class="meta" icon="fa-crown" :label="awards" title="Awards" />
            <Tag v-if="saves" class="meta" icon="fa-bookmark" :label="saves" title="Saves" />
            <Tag v-if="images" class="meta" icon="fa-image" :label="images" title="Images" />
            <Tag class="meta" icon="fa-chart-simple" :label="content.visits" title="Visits" />
            <Tag class="meta" icon="fa-comment" :label="responses" title="Responses" />
            <Tag class="meta" icon="fa-stopwatch" :label="formatDate(content.time)" :title="readableTime" />
            <Tag v-if="edited" class="meta" icon="fa-erase" :label="formatDate(edited)" title="Edited" />
            <Tag v-if="quarantined" class="danger" icon="fa-trash" label="Removed" title="Quarantined" />
            <ModerationState v-if="moderation" :moderation="moderation" :content-type="moderationType" />
            <slot name="actions" />
        </div>
    </header>
</template>

<style scoped lang="scss">
header {
    min-width: 0;
}
</style>