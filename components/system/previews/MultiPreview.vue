<script setup lang="ts">
import type { Sortable, Post, Image, Thread } from '~/types'

const props = defineProps<{
    item: Sortable
}>()


</script>

<template>
    <template v-if="item.id?.split(':')[0] == 'post'">
        <PostPreview :post="(item as Post)" />
    </template>
    <template v-else-if="item.id?.split(':')[0] == 'image'">
        <ImagePreview :image="(item as Image)" />
    </template>
    <template v-else-if="item.id?.split(':')[0] == 'thread'">
        <ThreadPreview :thread="(item as Thread)" />
    </template>
</template>


<style scoped lang="scss">
</style>