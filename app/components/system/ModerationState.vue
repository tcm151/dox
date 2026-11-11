<script setup lang="ts">
import type { ContentModerationState } from "@@/shared/types"

const props = defineProps<{
    moderation?: ContentModerationState
    contentType: "discussion" | "comment" | "thread"
}>()

const lockLabel = computed(() => {
    if (!props.moderation?.locked) return ""
    if (props.contentType === "comment") return "Direct replies locked"
    if (props.contentType === "thread") return "Thread replies locked"
    return "Comments locked"
})

const slowModeLabel = computed(() => {
    const interval = props.moderation?.slowed
    if (!interval) return ""
    const duration = interval % 60 === 0 ? `${interval / 60} min` : `${interval} sec`
    return `Slow mode: ${duration}`
})
</script>

<template>
    <div v-if="lockLabel || slowModeLabel" class="row wrap g-1">
        <Tag v-if="lockLabel" type="danger" icon="fa-lock" />
        <Tag v-if="slowModeLabel" type="warning" icon="fa-hourglass-half" :title="slowModeLabel" />
    </div>
</template>