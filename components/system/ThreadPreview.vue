<script setup lang="ts">
import type { Thread, User } from '~/types'

const props = defineProps<{
    thread: Thread
}>()

const settings = useUserSettings()

</script>

<template>
    <div class="thread" :class="{ 'animate': settings.state.hoverAnimations }">
        <div class="reply-to row center-inline g-2" v-if="(thread.replyTo as Thread).id != null" @click="navigateTo(`/thread/${extractId((thread.replyTo as Thread).id)}`)">
            <i class="fa-solid fa-reply-all fa-flip-horizontal"></i>
            <p>{{ (thread.replyTo as Thread).content.slice(128) }}</p>
        </div>
        <div class="main box column g-1 p-3" @click="navigateTo(`/thread/${extractId(thread.id)}`)">
            <Markdown class="mb-1" :content="thread.content" />
            <div class="row-wrap g-1">
                <Votes :target="thread" />
                <TopicTag v-for="topic in thread.topics" :topic="topic" />
                <div class="fill row-wrap g-1">
                    <UserTag :fill="1" :user="(thread.user as User)" />
                    <!-- <Tag :fill="1" type="info" icon="fa-message" :label="thread.comments.length.toString()" /> -->
                    <TimeTag :fill="1" :time="thread.time" />
                    <Tag :fill="1" type="info" icon="fa-chart-simple" :label="thread.visits.toString()" />
                    <Tag :fill="1" v-if="thread.timeEdited" type="danger" icon="fa-eraser" :label="formatDate(thread.timeEdited)" />
                </div>
            </div>
            <div class="fill row-wrap g-1">
                <Tag :fill="1" type="default" icon="fa-reply-all fa-flip-horizontal" label="Reply" />
                <Tag :fill="1" type="default" icon="fa-copy" label="Share" />
                <Tag type="default" icon="fa-flag" label="Report" />
                <Tag type="default" icon="fa-ellipsis" />
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
.thread {
    border-radius: 0.25rem;
    background-color: $dox-white-3;
    transition: transform 128ms;
    
    .main {
        overflow: hidden;
    }

    .reply-to + .main {
        border-top-left-radius: 0;
        border-top-right-radius: 0;
    }

    .reply-to {
        padding: 0.25rem 0.5rem 0.25rem 0.5rem;
        font-weight: 700;
        color: $dox-white-0;
        
        p {
            overflow-x: hidden;
            text-overflow: ellipsis;
            letter-spacing: 0.025rem;
        }
    }
}

.thread:has(.reply-to:hover)  {
    background-color: $dox-white-4;
}

.thread:hover {
    cursor: pointer;
    @include shadow(1px, $blur: 0.25rem, $spread: 0.25rem, $color: #CCC1);
}

.thread.animate:hover {
    transform: scale(102%, 105%);
}
</style>