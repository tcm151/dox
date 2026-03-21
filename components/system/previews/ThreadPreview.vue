<script setup lang="ts">
import type { Thread, User } from '~/types'

const props = defineProps<{
    thread: Thread
}>()

</script>

<template>
    <div class="thread">
        <div class="main box column px-3 pb-3" @click="navigateTo(`/thread/${extractId(thread.id)}`)">
            <Markdown class="content preview" :content="thread.content" />
            <div class="row-wrap g-1">
                <Votes :target="thread" />
                <div class="row-wrap f-1 g-1">
                    <Tag class="f-1" type="info" icon="fa-chart-simple" :label="thread.visits" />
                    <Tag class="f-1" type="info" icon="fa-message" :label="thread.replies.length.toString()" />
                    <UserTag class="f-1" :user="(thread.user as User)" />
                    <DurationTag class="f-1" :time="thread.time" />
                    <Tag v-if="thread.timeEdited" class="f-1" type="danger" icon="fa-eraser" :label="formatDate(thread.timeEdited)" />
                </div>
                <div v-if="thread.topics.length > 0" class="row-wrap f-1 g-1">
                    <TopicTag class="f-10" v-for="topic in thread.topics" :topic="topic" />
                </div>
            </div>
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
    cursor: pointer;
    @include shadow(1px, $blur: 0.25rem, $spread: 0.25rem, $color: #CCC1);
}

.thread.animate:hover {
    transform: scale(102%, 105%);
}
</style>