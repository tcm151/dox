<script setup lang="ts">
import type { Post, User } from "~/types"

const props = defineProps<{
    posts: Post[]
    loading?: boolean
    sorting?: boolean
    pagination?: boolean
    page?: number
}>()

const emit = defineEmits<{
    (event: 'refresh'): void
    (event: 'page', pageNumber: number): void
    (event: 'pageSize', size: number): void
}>()

const cache = useCache()

onMounted(() => sortBy(props.posts, sortType.value))
watch(props.posts, () => {
    sortBy(props.posts, sortType.value)
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

// BUG this does not work correctly, perhaps because of SSR
let sortType = cache.get("feed.sortType", () => "new")
function sort(type: string) {
    sortType.value = type
    sortBy(props.posts, type)
}

</script>

<template>
    <section class="column g-2">
        <header class="sorting row center g-2" v-if="props.sorting">
            <!-- does not work with pagination -->
            <!-- REFACTOR sorting needs to be done from the database -->
            <button class="refresh" @click="emit('refresh')">
                <i class="fa-solid fa-rotate" :class="{ spin: spinRefresh }"></i>
            </button>
            <slot name="header" />
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
        <TransitionGroup name="feed">
            <PostPreview :post="post" v-for="post in posts" :key="post.id" />
        </TransitionGroup>
        <!-- TODO allow more than five pages -->
        <footer class="pagination" v-if="pagination">
            <i class="fa-solid fa-caret-left" @click="emit('page', props.page! - 1)"></i>
            <span :class="{ current: page! == 1 }" @click="emit('page', 1)">1</span>
            <span :class="{ current: page! == 2 }" @click="emit('page', 2)">2</span>
            <span :class="{ current: page! == 3 }" @click="emit('page', 3)">3</span>
            <span :class="{ current: page! == 4 }" @click="emit('page', 4)">4</span>
            <span :class="{ current: page! == 5 }" @click="emit('page', 5)">5</span>
            <i class="fa-solid fa-caret-right" @click="emit('page', props.page! + 1)"></i>
        </footer>
    </section>
</template>

<style scoped lang="scss">

header.sorting {
    button {
        flex: 1 1;
        
        @media only screen and (max-width: 400px) {
            span {
                display: none;
            }    
        }
    }

    .refresh {
        flex: 0 1;
        color: $dox-white-2;
        background-color: $dox-black-0;

        i.spin {
            animation: spin 512ms linear infinite;
        }
    }

    .refresh:hover {
        background-color: $dox-black-2;
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