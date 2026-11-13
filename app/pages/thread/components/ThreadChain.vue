<script setup lang="ts">
import type { Thread } from '@@/shared/types'
import ThreadReply from './ThreadReply.vue'

defineProps<{
    thread: Thread
}>()

const emit = defineEmits<{
    (event: 'reply'): void
}>()

const replyingTo = ref<string>()
const submitting = ref(false)

function isThreadLoadMore(item: Thread): boolean {
    return item.id === "thread:load_more"
}

function toggleReply(target: Thread) {
    if (submitting.value) return

    if (replyingTo.value === target.id) {
        cancelReply()
    }
    else {
        replyingTo.value = target.id
    }
}

function cancelReply() {
    replyingTo.value = undefined
}
</script>

<template>
    <div class="thread box row hover-shadow">
        <aside class="indent-line br-small ml-4 my-4" />
        <div class="main column g-2 f-1 p-4">
            <ThreadReply
                :thread="thread"
                :active="replyingTo === thread.id"
                @reply="toggleReply(thread)"
                @cancel="cancelReply"
                @submitting="submitting = $event"
                @updated="emit('reply')"
            />
            <template v-if="thread.chain">
                <template v-for="reply in thread.chain" :key="reply.id">
                    <Tag v-if="isThreadLoadMore(reply)" class="dark mb-3" icon="fa-ellipsis" label="More replies omitted" />
                    <ThreadReply v-else
                        :thread="reply"
                        :active="replyingTo === reply.id"
                        @reply="toggleReply(reply)"
                        @cancel="cancelReply"
                        @submitting="submitting = $event"
                        @updated="emit('reply')"
                    />
                </template>
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