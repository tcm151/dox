<script setup lang="ts">
import type { Thread, User } from '~/types';

const route = useRoute()
const id = route.params.id.toString()

const { data: thread, pending, refresh } = useAsyncData(`thread:${id}`, () => {
    return $fetch<Thread>(`/api/thread/${id}`)
})

const hints = useHints()

</script>

<template>
    <article class="column p-4" v-if="thread">
        <div class="main box column p-4" @click="navigateTo(`/thread/${extractId(thread.id)}`)">
            <header class="row-wrap g-1">
                <Votes :target="thread" />
                <TopicTag v-for="topic in thread.topics" :topic="topic" />
                <div class="fill row-wrap g-1">
                    <UserTag :fill="1" :user="(thread.user as User)" />
                    <!-- <Tag :fill="1" type="info" icon="fa-message" :label="thread.comments.length.toString()" /> -->
                    <TimeTag :fill="1" :time="thread.time" />
                    <Tag :fill="1" type="info" icon="fa-chart-simple" :label="thread.visits.toString()" />
                    <Tag :fill="1" v-if="thread.timeEdited" type="danger" icon="fa-eraser" :label="formatDate(thread.timeEdited)" />
                    <Tag type="info" icon="fa-ellipsis" @click.stop="hints.addWarning('We are still working on this...')" />
                </div>
            </header>
            <Markdown class="content" :content="thread.content" />
            <div class="fill row-wrap g-1">
                <button class="fill">
                    <i class="fa-solid fa-reply-all fa-flip-horizontal"></i>
                    <span>Reply</span>
                </button>
                <button class="fill">
                    <i class="fa-solid fa-copy"></i>
                    <span>Share</span>
                </button>
                <button class="fill">
                    <i class="fa-solid fa-flag"></i>
                    <span>Report</span>
                </button>
                <button>
                    <i class="fa-solid fa-ellipsis"></i>
                </button>
            </div>
        </div>
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width(60rem, 1rem);
}
</style>~/types/core