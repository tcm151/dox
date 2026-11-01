<script setup lang="ts">
import type { Thread } from '@@/shared/types'

const props = defineProps<{
    thread: Thread
}>()
</script>

<template>
    <div class="thread clickable box background animate hover-shadow">
        <div class="main box column px-3 pt-3" @click="navigateTo(`/thread/${extractId(thread.id)}`)">
            <div class="row wrap g-1">
                <Votes :target="thread" />
                <div class="row wrap f-1 g-1">
                    <UserTag class="f-1" :user="thread.user" />
                    <div v-if="props.thread.topics.length > 0" class="row wrap f-1 g-1">
                        <TopicTag v-for="topic in thread.topics" :topic="topic" />
                    </div>
                </div>
                <div class="row wrap g-1">
                    <Tag class="meta" icon="fa-chart-simple" :label="thread.visits" />
                    <Tag class="meta" icon="fa-comment" :label="thread.replies.length.toString()" />
                    <DurationTag class="meta" :time="thread.time" />
                    <ModerationState :moderation="thread.moderation" content-type="thread" />
                    <!-- <Tag v-if="thread.timeEdited" class="meta" icon="fa-eraser" :label="formatDate(thread.timeEdited)" /> -->
                </div>
            </div>
            <Markdown class="content preview" :content="thread.content" />
            <aside v-if="thread.images[0]" class="thread-images row wrap g-2 mb-3">
                <img v-for="image in thread.images" class="br-small border-subtle" :src="image.url">
            </aside>
            <aside v-if="thread.quote" class="br-medium border-subtle mb-3 px-3 pt-3">
                <div class="row wrap g-1">
                    <Votes :target="thread.quote" />
                    <div class="row wrap f-1 g-1">
                        <UserTag class="f-1" :user="thread.quote.user" />
                        <div v-if="thread.quote.topics.length > 0" class="row wrap f-1 g-1">
                            <TopicTag v-for="topic in thread.quote.topics" :topic="topic" />
                        </div>
                    </div>
                    <div class="row wrap g-1">
                        <Tag class="meta" icon="fa-chart-simple" :label="thread.quote.visits" />
                        <Tag class="meta" icon="fa-comment" :label="thread.quote.replies.length.toString()" />
                        <DurationTag class="meta" :time="thread.quote.time" />
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

aside.thread-images {
    img {
        width: 6rem;
        height: 6rem;
        object-fit: cover;
        background-color: $white-1;
    }
}
</style>