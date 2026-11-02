<script setup lang="ts">
import type { Gallery, Image, Post, Thread } from "@@/shared/types"

type ContentHeaderItem = Post | Thread | Gallery | Image

const props = withDefaults(defineProps<{
    content: ContentHeaderItem
    context?: "preview" | "detail"
    pinned?: boolean
}>(), {
    context: "preview",
})

const post = computed(() => "title" in props.content ? props.content : undefined)
const thread = computed(() => "replies" in props.content ? props.content : undefined)
const gallery = computed(() => "comments" in props.content && !("title" in props.content) ? props.content : undefined)
const image = computed(() => "type" in props.content ? props.content : undefined)
const topics = computed(() => "topics" in props.content ? props.content.topics : [])
const moderation = computed(() => "moderation" in props.content ? props.content.moderation : undefined)
const moderationType = computed(() => thread.value ? "thread" : "discussion")

const archived = computed(() => props.content.status === "archived"
    && (post.value !== undefined || (gallery.value !== undefined && props.context === "detail")))

const discussionCount = computed(() => {
    if ("replies" in props.content) return props.content.replies.length
    if ("comments" in props.content) return props.content.comments.length
    return undefined
})

const awards = computed(() => post.value?.votes.awards.length)
const saves = computed(() => post.value?.votes.saves.length)
const imageCount = computed(() => gallery.value?.images.length)
const mediaType = computed(() => image.value?.type)
const tokens = computed(() => image.value?.tokens)

const editedTime = computed(() => props.context === "detail"
    && "edited" in props.content
    && props.content.edited
        ? props.content.timeEdited
        : undefined)

const readableTime = computed(() => props.content.time.split(".")[0]?.replace("T", " "))

</script>

<template>
    <header class="row wrap g-1">
        <Votes :target="content" />
        <template v-if="topics.length">
            <TopicTag v-for="topic in topics" class="f-3 b-0" :key="topic" :topic="topic" />
        </template>
        <UserTag v-if="content.user" class="f-2 b-0" :user="content.user" />
        <Tag v-if="context === 'preview' && post && pinned" class="meta" icon="fa-thumbtack" />
        <Tag v-if="archived" class="meta" icon="fa-folder-closed" />
        <Tag v-if="context === 'preview' && awards" class="meta" icon="fa-crown" :label="awards" />
        <Tag v-if="context === 'preview' && saves" class="meta" icon="fa-box-archive" :label="saves" />
        <Tag class="meta" icon="fa-chart-simple" :label="content.visits" />
        <Tag v-if="discussionCount !== undefined" class="meta" icon="fa-comment" :label="discussionCount" />
        <Tag class="meta" icon="fa-stopwatch" :label="formatDate(content.time)" :title="readableTime">
            <template v-if="editedTime">
                <i class="fa-solid fa-eraser"></i>
                {{ formatDate(editedTime) }}
            </template>
        </Tag>
        <Tag v-if="context === 'detail' && imageCount" class="meta" icon="fa-image" :label="imageCount" />
        <Tag v-if="context === 'detail' && mediaType" class="meta" icon="fa-image" :label="mediaType" />
        <Tag v-if="context === 'detail' && tokens !== undefined" class="warning" icon="fa-cube" :label="`${tokens} tokens`" />
        <ModerationState v-if="moderation" :moderation="moderation" :content-type="moderationType" />
        <slot name="actions" />
    </header>
</template>

<style scoped lang="scss">
header {
    min-width: 0;
}
</style>