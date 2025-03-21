<script setup lang="ts" generic="T extends Sortable">
import type { AsyncData } from "#app";
import type { Sortable } from "~/utils/sorting"

const props = defineProps<{
    items: AsyncData<T[] | null, any>
    sorting?: boolean
}>()

const emit = defineEmits<{
    (event: 'refresh'): void
}>()

const cache = useCache()

let sortType = cache.get("feed.sortType", () => "new")
const sortedItems = computed(() => sortList(props.items.data.value ?? [], sortType.value))

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
    <section class="column g-2">
        <header class="sorting row center g-2" v-if="props.sorting">
            <ClientOnly>
                <!-- REFACTOR sorting needs to be done from the database -->
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
            <slot v-for="item in sortedItems" name="item" v-bind="(item as T)" :key="item.id" />
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