<script setup lang="ts">
import type { Thread } from '@@/shared/types'

const props = defineProps<{
    thread: Thread
    chain?: boolean
}>()

</script>

<template>
    <div class="thread box row hover-shadow">
        <aside class="indent-line br-small ml-4 my-4" />
        <div class="main column f-1 px-4 pt-4">
            <section>
                <div class="row wrap g-1">
                    <Votes :target="thread" />
                    <div class="row wrap f-1 g-1">
                        <UserTag :user="thread.user" />
                        <Tag type="info" icon="fa-chart-simple" :label="thread.visits" />
                        <Tag type="info" icon="fa-comment" :label="thread.replies.length.toString()" />
                        <DurationTag :time="thread.time" />
                        <Tag type="link" icon="fa-right-to-bracket" label="View" @click="navigateTo(`/thread/${extractId(thread.id)}`)" />
                    </div>
                </div>
                <Markdown class="content preview" :content="thread.content" />
            </section>
            <template v-if="thread.chain">
                <section v-for="reply in thread.chain">
                    <div class="row wrap g-1">
                        <Votes :target="reply" />
                        <div class="row wrap f-1 g-1">
                            <UserTag :user="reply.user" />
                            <Tag type="info" icon="fa-chart-simple" :label="reply.visits" />
                            <Tag type="info" icon="fa-comment" :label="reply.replies.length.toString()" />
                            <DurationTag :time="reply.time" />
                            <Tag v-if="reply.timeEdited" class="f-1" type="danger" icon="fa-eraser" :label="formatDate(reply.timeEdited)" />
                            <Tag v-if="!reply.deleted" type="link" icon="fa-right-to-bracket" label="View" @click="navigateTo(`/thread/${extractId(reply.id)}`)" />
                        </div>
                    </div>
                    <Markdown class="content preview" :content="reply.content" />
                </section>
            </template>
        </div>
    </div>
</template>

<style scoped lang="scss">

.thread {
    .indent-line {
        background-color: $white-1;
        flex: 0 0 8px;
    }

    .indent-line:hover {
        background-color: $white-2;
    }
    
    .main {
        overflow: hidden;
    }
}

</style>