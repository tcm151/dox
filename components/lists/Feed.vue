<script setup lang="ts" generic="T extends Sortable">
import type { Sortable } from "~/utils/sorting"

interface AsyncData<DataT, ErrorT> {
    data: Ref<DataT>
    refresh: (opts?: any) => Promise<void>
    execute: (opts?: any) => Promise<void>
    clear: () => void
    error: Ref<ErrorT | null>
    status: Ref<'idle' | 'pending' | 'success' | 'error'>
}

const props = defineProps<{
    items: AsyncData<T[] | null, any>
    sorting?: boolean
}>()

const emit = defineEmits<{
    (event: 'refresh'): void
}>()

const cache = useCache()

let sortType = cache.get("feed.sortType", () => "new")
const sortedItems = computed(() => {
    if (props.sorting) {
        return sortList(props.items.data.value ?? [], sortType.value)
    }
    else {
        return props.items.data.value ?? []
    }
})

const spinRefresh = ref(false)
watch(() => props.items.status.value, (status) => {
    if (status == "pending") {
        spinRefresh.value = true
    }
    else {
        setTimeout(() => spinRefresh.value = false, 512)
    }
})
</script>

<template>
    <section class="column g-2" v-if="items">
        <header class="sorting row center g-2" v-if="props.sorting">
            <ClientOnly>
                <button class="refresh dark" @click="items.refresh()">
                    <i class="fa-solid fa-rotate" :class="{ spin: spinRefresh }"></i>
                </button>
                <slot name="buttons" />
                <button @click="sortType = 'new'" :class="{ selected: sortType === 'new' }">
                    <i class="fa-solid fa-egg"></i>
                    <span>New</span>
                </button>
                <button @click="sortType = 'hot'" :class="{ selected: sortType === 'hot' }">
                    <i class="fa-solid fa-fire"></i>
                    <span>Hot</span>
                </button>
                <button @click="sortType = 'top'" :class="{ selected: sortType === 'top' }">
                    <i class="fa-solid fa-ranking-star"></i>
                    <span>Top</span>
                </button>
            </ClientOnly>
        </header>
        <ClientOnly>
            <template v-for="item in sortedItems" :key="item.id">
                <slot name="item" v-bind="(item as T)" />
            </template>
        </ClientOnly>
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