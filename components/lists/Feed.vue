<script setup lang="ts" generic="T extends Sortable">
import type { Sortable } from "~/types"

interface AsyncData<DataT, ErrorT> {
    data: Ref<DataT>
    refresh: (opts?: any) => Promise<void>
    execute: (opts?: any) => Promise<void>
    clear: () => void
    error: Ref<ErrorT | undefined>
    status: Ref<'idle' | 'pending' | 'success' | 'error'>
}

const props = defineProps<{
    items: AsyncData<T[] | undefined, any>
    sorting?: boolean
}>()

const emit = defineEmits<{
    (event: 'refresh', sortBy: string): void
}>()

const cache = useCache()

let sortType = cache.get("feed.sort", () => "new")

const spinRefresh = ref(false)
watch(() => props.items.status.value, (status) => {
    if (status == "pending") {
        spinRefresh.value = true
    }
    else {
        setTimeout(() => spinRefresh.value = false, 512)
    }
})

function sortFeed(type: string) {
    sortType.value = type
    emit("refresh", sortType.value)
}
</script>

<template>
    <section class="column g-2" v-if="items">
        <header class="sorting row center g-2" v-if="props.sorting">
            <button class="refresh dark" @click="items.refresh">
                <i class="fa-solid fa-rotate" :class="{ spin: spinRefresh }"></i>
            </button>
            <slot name="buttons" />
            <button @click="sortFeed('new')" :class="{ selected: sortType === 'new' }">
                <i class="fa-solid fa-egg"></i>
                <span>New</span>
            </button>
            <button @click="sortFeed('hot')" :class="{ selected: sortType === 'hot' }">
                <i class="fa-solid fa-fire"></i>
                <span>Hot</span>
            </button>
            <button @click="sortFeed('top')" :class="{ selected: sortType === 'top' }">
                <i class="fa-solid fa-ranking-star"></i>
                <span>Top</span>
            </button>
        </header>
        <template v-for="item in props.items.data.value" :key="item.id">
            <slot name="item" v-bind="(item as T)" />
        </template>
    </section>
</template>

<style scoped lang="scss">

header.sorting {
    button:not(.refresh), :slotted(button) {
        flex: 1 1;
        
        @media only screen and (max-width: 400px) {
            span {
                display: none;
            }    
        }
    }

    button.refresh {
        i.spin {
            animation: spin 512ms linear infinite;
        }
    }

    .selected {
        color: $white-0;
        background-color: $white-3;
    }
}

.feed-move, .feed-enter-active, .feed-leave-active {
    transition: all 512ms ease;
}

.feed-enter-from, .feed-leave-to {
    opacity: 0;
}
</style>