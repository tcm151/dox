<script setup lang="ts">
import type { SearchComment, Sortable, Post, Thread, Gallery } from '@@/shared/types'

const props = defineProps<{
    item: Sortable | SearchComment
    pinned?: boolean
}>()


</script>

<template>
    <template v-if="item.id?.split(':')[0] == 'comment'">
        <SearchCommentPreview :comment="(item as SearchComment)" />
    </template>
    <template v-else-if="item.id?.split(':')[0] == 'post'">
        <PostPreview :post="(item as Post)" :pinned="pinned" />
    </template>
    <template v-else-if="item.id?.split(':')[0] == 'gallery'">
        <GalleryPreview :gallery="(item as Gallery)" :pinned="pinned" />
    </template>
    <template v-else-if="item.id?.split(':')[0] == 'thread'">
        <ThreadPreview :thread="(item as Thread)" :pinned="pinned" />
    </template>
</template>


<style scoped lang="scss">
</style>