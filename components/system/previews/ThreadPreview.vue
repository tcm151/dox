<script setup lang="ts">
import type { Thread, User } from '~/types'

const hints = useHints()

const props = defineProps<{
    thread: Thread
}>()

const settings = useSettings()

</script>

<template>
    <div class="thread" :class="{ 'animate': settings.user.hoverAnimations }">
        <div class="reply-to row center-inline g-2" v-if="(thread.replyTo as Thread).id != null" @click="navigateTo(`/thread/${extractId((thread.replyTo as Thread).id)}`)">
            <i class="fa-solid fa-reply-all fa-flip-horizontal"></i>
            <p>{{ (thread.replyTo as Thread).content.slice(128) }}</p>
        </div>
        <div class="main box column px-3 pb-3" @click="navigateTo(`/thread/${extractId(thread.id)}`)">
            <Markdown class="content preview" :content="thread.content" />
            <div class="row-wrap g-1">
                <Votes :target="thread" />
                <div class="row-wrap f-1 g-1">
                    <UserTag class="f-1" :user="(thread.user as User)" />
                    <!-- <Tag class="f-1" type="info" icon="fa-message" :label="thread.comments.length.toString()" /> -->
                    <Tag class="f-1" type="info" icon="fa-stopwatch" :label="formatDate(thread.time)" />
                    <!-- <Tag class="f-1" type="info" icon="fa-chart-simple" :label="thread.visits.toString()" /> -->
                    <Tag v-if="thread.timeEdited" class="f-1" type="danger" icon="fa-eraser" :label="formatDate(thread.timeEdited)" />
                    <!-- <Tag type="info" icon="fa-ellipsis" @click.stop="hints.addWarning('We are still working on this...')" /> -->
                </div>
                <TopicTag class="f-10" v-for="topic in thread.topics" :topic="topic" />
            </div>
            <!-- <div class="fill row-wrap g-1">
                <Tag class="f-1" type="default" icon="fa-reply-all fa-flip-horizontal" label="Reply" @click.stop="hints.addWarning('We are still working on this...')" />
                <Tag class="f-1" type="default" icon="fa-copy" label="Share" @click.stop="hints.addWarning('We are still working on this...')" />
                <Tag class="f-1" type="default" icon="fa-flag" label="Report" @click.stop="hints.addWarning('We are still working on this...')" />
                <Tag type="default" icon="fa-ellipsis" @click.stop="hints.addWarning('We are still working on this...')" />
            </div> -->
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

    .reply-to + .main {
        border-top-left-radius: 0;
        border-top-right-radius: 0;
    }

    .reply-to {
        padding: 0.25rem 0.5rem 0.25rem 0.5rem;
        font-weight: 700;
        color: $white-0;
        
        p {
            overflow-x: hidden;
            text-overflow: ellipsis;
            letter-spacing: 0.025rem;
        }
    }
}

.thread:has(.reply-to:hover)  {
    background-color: $white-4;
}

.thread:hover {
    cursor: pointer;
    @include shadow(1px, $blur: 0.25rem, $spread: 0.25rem, $color: #CCC1);
}

.thread.animate:hover {
    transform: scale(102%, 105%);
}
</style>~/types/core