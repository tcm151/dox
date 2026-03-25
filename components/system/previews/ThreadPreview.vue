<script setup lang="ts">
import type { Thread } from '~/types'

const props = defineProps<{
    thread: Thread
}>()

</script>

<template>
    <div class="thread box background">
        <div class="main box column px-3 pt-3" @click="navigateTo(`/thread/${extractId(thread.id)}`)">
            <div class="row wrap g-1">
                <Votes :target="thread" />
                <div class="row wrap f-1 g-1">
                    <UserTag class="f-1" :user="thread.user" />
                    <Tag class="f-1" type="info" icon="fa-chart-simple" :label="thread.visits" />
                    <Tag class="f-1" type="info" icon="fa-comment" :label="thread.replies.length.toString()" />
                    <DurationTag class="f-1" :time="thread.time" />
                    <Tag v-if="thread.timeEdited" class="f-1" type="danger" icon="fa-eraser" :label="formatDate(thread.timeEdited)" />
                </div>
                <div v-if="thread.topics.length > 0" class="row wrap f-1 g-1">
                    <TopicTag v-for="topic in thread.topics" :topic="topic" />
                </div>
            </div>
            <Markdown class="content preview" :content="thread.content" />
            <aside v-if="thread.quote" class="quote br-medium mb-3 px-3 pt-3">
                <div class="row wrap g-1">
                    <Votes :target="thread.quote" />
                    <div class="row wrap g-1">
                        <UserTag :user="thread.quote.user" />
                        <Tag type="info" icon="fa-chart-simple" :label="thread.quote.visits" />
                        <Tag type="info" icon="fa-comment" :label="thread.quote.replies.length.toString()" />
                        <DurationTag :time="thread.quote.time" />
                    </div>
                    <div v-if="thread.quote.topics.length > 0" class="row wrap f-1 g-1">
                        <TopicTag v-for="topic in thread.quote.topics" :topic="topic" />
                    </div>
                </div>
                <Markdown class="content preview" :content="thread.quote.content" />
            </aside>
        </div>
    </div>
</template>

<style scoped lang="scss">
.thread {
    .main {
        overflow: hidden;
    }
}

.thread:hover {
    cursor: pointer;
    @include shadow(1px, $blur: 0.25rem, $spread: 0.25rem, $color: #CCC1);
}

aside.quote {
    border: 1px solid $white-2;
}
</style>