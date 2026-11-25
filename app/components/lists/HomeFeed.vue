<script setup lang="ts">
import type { Sortable } from "@@/shared/types"

const props = defineProps<{
    feedType: string
}>()

// The parent keys this list by feed type, so the endpoint stays fixed for this instance.
const items = useFeedDatasource<Sortable>(`/api/feed/${props.feedType}`, { sorting: true })
</script>

<template>
    <Feed :items="items">
        <template #buttons>
            <slot name="buttons" />
        </template>
        <template #item="item">
            <MultiPreview :item="item" />
        </template>
    </Feed>
</template>
