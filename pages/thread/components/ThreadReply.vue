<script setup lang="ts">
import type { Thread, User } from '~/types'

const props = defineProps<{
    thread: Thread
}>()

function replyToThread() {
    navigateTo(`/thread/${extractId(props.thread.id)}`)
}

</script>

<template>
    <div class="thread">
        <div class="main box column px-4 pt-4">
            <div class="row-wrap g-1">
                <Votes :target="thread" />
                <!-- <div v-if="thread.topics.length > 0" class="row-wrap f-1 g-1">
                    <TopicTag class="f-10" v-for="topic in thread.topics" :topic="topic" />
                </div> -->
                <div class="row-wrap f-1 g-1">
                    <Tag type="info" icon="fa-chart-simple" :label="thread.visits" />
                    <Tag type="info" icon="fa-message" :label="thread.replies.length.toString()" />
                    <UserTag :user="(thread.user as User)" />
                    <DurationTag :time="thread.time" />
                    <Tag v-if="thread.timeEdited" class="f-1" type="danger" icon="fa-eraser" :label="formatDate(thread.timeEdited)" />
                    <Tag v-if="!thread.deleted" type="link" icon="fa-reply" label="Reply" @click="replyToThread" />
                </div>
            </div>
            <Markdown class="content preview" :content="thread.content" />
        </div>
    </div>
</template>

<style scoped lang="scss">
.thread {
    border-radius: 0.25rem;
    background-color: $white-3;
    transition: transform 128ms;
    
    .main {
        overflow: hidden;
    }
}

.thread:hover {
     @include shadow(1px, $blur: 0.25rem, $spread: 0.25rem, $color: #CCC1);
}
</style>