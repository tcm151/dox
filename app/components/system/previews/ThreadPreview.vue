<script setup lang="ts">
import type { Thread } from '@@/shared/types'

const props = defineProps<{
    thread: Thread
}>()
</script>

<template>
    <ContentVisibility :tags="thread.tags">
        <div class="thread clickable box background animate hover-shadow">
            <div class="main box column px-3 pt-3" @click="navigateTo(`/thread/${extractId(thread.id)}`)">
                <ContentHeader :content="thread" context="preview" />
                <Markdown class="content preview" :content="thread.content" />
                <aside v-if="thread.images[0]" class="thread-images row wrap g-2 mb-3">
                    <img v-for="image in thread.images" class="br-small border-subtle" :src="image.url">
                </aside>
                <aside v-if="thread.quote" class="br-medium border-subtle mb-3 px-3 pt-3">
                    <ContentVisibility :tags="thread.quote.tags">
                        <ContentHeader :content="thread.quote" context="preview" />
                        <Markdown class="content preview" :content="thread.quote.content" />
                    </ContentVisibility>
                </aside>
            </div>
        </div>
    </ContentVisibility>
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