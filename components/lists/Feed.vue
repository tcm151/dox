<script setup lang="ts" generic="T extends Sortable">
import type { Sortable } from "~/utils/sorting"

const props = defineProps<{
    pagination?: {
        page: number
        size: number
    }
    sorting?: boolean
    loading?: boolean
    items: T[]
}>()

const emit = defineEmits<{
    (event: 'refresh'): void
    (event: 'pagination', state: { page: number, size: number }): void
}>()

const cache = useCache()

onMounted(() => sortList(props.items, sortType.value))
watch(props.items, () => {
    sortList(props.items, sortType.value)
})

const spinRefresh = ref(false)
watch(() => props.loading, (loading) => {
    if (loading) {
        spinRefresh.value = true
    }
    else {
        setTimeout(() => spinRefresh.value = false, 512)
    }
})

let sortType = cache.get("feed.sortType", () => "new")
function sort(type: string) {
    sortType.value = type
    sortList(props.items, sortType.value)
}

</script>

<template>
    <section class="column g-2">
        <header class="sorting row center g-2" v-if="props.sorting">
            <!-- REFACTOR sorting needs to be done from the database -->
            <button class="refresh dark" @click="emit('refresh')">
                <i class="fa-solid fa-rotate" :class="{ spin: spinRefresh }"></i>
            </button>
            <slot name="buttons" />
            <button @click="sort('new')" :class="{ selected: sortType === 'new' }">
                <i class="fa-solid fa-egg"></i>
                <span>New</span>
            </button>
            <button @click="sort('hot')" :class="{ selected: sortType === 'hot' }">
                <i class="fa-solid fa-fire"></i>
                <span>Hot</span>
            </button>
            <button @click="sort('top')" :class="{ selected: sortType === 'top' }">
                <i class="fa-solid fa-ranking-star"></i>
                <span>Top</span>
            </button>
        </header>
        <Ad />
        <!-- BUG transition group breaks SSR and sorting -->
        <!-- <TransitionGroup name="items"> -->
            <slot v-for="item in items" name="item" v-bind="item" :key="item.id" />
        <!-- </TransitionGroup> -->
        <!-- TODO convert to infinite scroll -->
        <Ad />
        <footer class="pagination" v-if="pagination">
            <i class="fa-solid fa-caret-left" @click="emit('pagination', { size: 250, page: pagination.page - 1 })"></i>
            <span :class="{ current: pagination.page == 1 }" @click="emit('pagination', { size: 250, page: 1 })">1</span>
            <span :class="{ current: pagination.page == 2 }" @click="emit('pagination', { size: 250, page: 2 })">2</span>
            <span :class="{ current: pagination.page == 3 }" @click="emit('pagination', { size: 250, page: 3 })">3</span>
            <span :class="{ current: pagination.page == 4 }" @click="emit('pagination', { size: 250, page: 4 })">4</span>
            <span :class="{ current: pagination.page == 5 }" @click="emit('pagination', { size: 250, page: 5 })">5</span>
            <i class="fa-solid fa-caret-right" @click="emit('pagination', { size: 250, page: pagination.page + 1 })"></i>
        </footer>
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
        color: $dox-white-0;
        background-color: $dox-white-3;
    }
}

.feed-move, .feed-enter-active, .feed-leave-active {
    transition: all 512ms ease;
}

.feed-enter-from, .feed-leave-to {
    opacity: 0;
}

footer.pagination {
    @include flex-h (0.5rem);
    justify-content: center;

    span, i {
        width: 2rem;
        padding: 0.25rem 0;
        font-size: 1rem;
        font-weight: 700;
        text-align: center;
        line-height: 20px;
        border-radius: 0.25rem;
        background-color: $dox-white-2;
    }

    span:hover, i:hover {
        cursor: pointer;
        color: $dox-white-0;
        background-color: $dox-white-3;
    }

    .current {
        color: $dox-white-2;
        background-color: $dox-black-0;
    }

    .current:hover {
        background-color: $dox-black-2;
    }
}
</style>