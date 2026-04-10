<script setup lang="ts" generic="T extends Sortable">
import type { FetchError } from "ofetch"
import type { AsyncData } from "#app";
import type { Sortable } from "@@/shared/types"

const props = defineProps<{
    items: AsyncData<T[] | undefined, FetchError<any> | undefined>
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
    <section v-if="items" class="column g-2">
        <header v-if="props.sorting" class="sorting row center g-2">
            <button class="refresh dark" @click="items.refresh()">
                <i class="fa-solid fa-rotate" :class="{ spin: spinRefresh }"></i>
            </button>
            <ClientOnly>
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
            </ClientOnly>
        </header>
        <ClientOnly>
            <template v-if="props.items.data.value && props.items.data.value.length > 0">
                <template v-for="item in props.items.data.value" :key="item.id">
                    <slot name="item" v-bind="(item as T)" />
                </template>
            </template>
            <template v-else>
                <div class="column center box p-4">
                    There is nothing here currently.
                </div>
            </template>
        </ClientOnly>
    </section>
</template>

<style scoped lang="scss">

header.sorting {
    button:not(.refresh), :slotted(button) {
        flex: 1 1;
        
        @media (max-width: $bp-compact) {
            span {
                display: none;
            }    
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