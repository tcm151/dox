<script setup lang="ts">
import type { Thread } from '@@/shared/types'

const props = defineProps<{
    thread: Thread
    pinned?: boolean
}>()
</script>

<template>
    <ContentVisibility :tags="thread.tags">
        <div class="thread clickable box background animate hover-shadow" :class="{ pinned }">
            <div class="main box column g-2 p-3" @click="navigateTo(`/thread/${extractId(thread.id)}`)">
                <ContentHeader :content="thread" :pinned="pinned" />
                <Markdown compact class="content preview" :content="thread.content" />
                <aside v-if="thread.images[0]" class="thread-images row wrap g-2 mb-3">
                    <img v-for="image in thread.images" class="br-small border-subtle" :src="image.url">
                </aside>
                <aside v-if="thread.quote" class="br-medium border-subtle column g-2 p-3">
                    <ContentVisibility :tags="thread.quote.tags">
                        <ContentHeader :content="thread.quote" />
                        <Markdown compact class="content preview" :content="thread.quote.content" />
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

    &.pinned .main {
        border: 2px solid $white-2;
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