<script setup lang="ts">
import { Post } from "~/types"

const props = defineProps<{
    posts: Post[]
    sorting?: boolean
    pagination?: boolean
    page?: number
}>()

const emit = defineEmits<{
    (event: 'refresh'): void
    (event: 'page', pageNumber: number): void
    (event: 'pageSize', size: number): void
}>()

const vote = useVoting();
const sorting = useSorting();
const settings = useSettings();

onMounted(() => sorting.sortBy(props.posts, "hot"))

let sortType = ref("hot")
function sort(type: string) {
    sortType.value = type
    sorting.sortBy(props.posts, type)
}

</script>

<template>
    <div class="feed">
        <div class="sorting row g-2" v-if="props.sorting">
            <button class="refresh" @click="emit('refresh')">
                <i class="fa-solid fa-rotate"></i>
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
        </div>
        <div class="post" :class="{ 'animate': settings.state.hoverAnimations }" v-for="post in posts" :key="post.id">
            <h3 class="title mx-1 my-1" @click="navigateTo(`/post/${extractId(post.id!)}`)">
                {{ post.title }}
            </h3>
            <div class="row-wrap g-1">
                <div class="votes row g-1">
                    <span class="positive" @click="vote.positive(post.id, post.votes)">
                        {{ post?.votes.positive.length }}
                    </span>
                    <span class="misleading" @click="vote.misleading(post.id, post.votes)">
                        {{ post?.votes.misleading.length }}
                    </span>
                    <span class="negative" @click="vote.negative(post.id, post.votes)">
                        {{ post?.votes.negative.length }}
                    </span>
                </div>
                <span class="topic" v-for="topic in post?.topics" @click="navigateTo(`/topic/${topic}`)">
                    {{ topic }}
                </span>
                <div class="details row g-1">
                    <span class="info" @click="navigateTo(`/user/${extractId(post.user.id)}`)">
                        u/{{ post?.user.name ?? "deleted" }}
                    </span>
                    <span class="info">{{ post.comments.length }} comments</span>
                    <span class="info">{{ formatDate(post.time as any) }}</span>
                </div>
            </div>
        </div>
        <!-- TODO add actual pagination support -->
        <div class="pagination" v-if="pagination">
            <i class="fa-solid fa-caret-left"></i>
            <span :class="{ current: page! == 1 }" @click="emit('page', 1)">1</span>
            <span :class="{ current: page! == 2 }" @click="emit('page', 2)">2</span>
            <span :class="{ current: page! == 3 }" @click="emit('page', 3)">3</span>
            <span :class="{ current: page! == 4 }" @click="emit('page', 4)">4</span>
            <span :class="{ current: page! == 5 }" @click="emit('page', 5)">5</span>
            <!-- <i class="fa-solid fa-ellipsis"></i> -->
            <i class="fa-solid fa-caret-right"></i>
        </div>
    </div>
</template>

<style scoped lang="scss">
.feed {
    @include flex-v (0.5rem);
}

.sorting {
    button {
        flex: 1 1;
        @include flex-h (0.5rem);
        align-items: center;
        justify-content: center;
    }

    .refresh {
        flex: 0 1;
        color: $dox-white;
        background-color: $dox-black;
    }

    .refresh:hover {
        background-color: $dox-grey-dark;
    }

    .selected {
        color: $dox-white-ultra;
        background-color: $dox-grey-light;
    }

    // .selected:hover {
    //     color: $dox-grey-light;
    //     background-color: $dox-white-light;
    //     border: 0.2rem solid $dox-grey-light;
    // }
}

.post {
    padding: 0.25rem 0.5rem 0.5rem 0.5rem;
    border-radius: 0.25rem;
    background-color: $dox-white-ultra;
    transition: transform 128ms;

    span {
        padding: 0.25rem 1rem;

        font-size: 0.8rem;
        font-weight: 700;
        text-align: center;

        outline: 1px transparent;
        border-radius: 0.25rem;
    }
}

.post:hover {
    cursor: pointer;
    @include shadow(1px, $blur: 0.25rem, $spread: 0.25rem, $color: #CCC1);
}

.post.animate:hover {
    transform: scale(102%, 105%);
}

.row {
    white-space: nowrap;
}

.votes {
    flex: 0 1;
    
    > * {
        width: 0.5rem;
        font-weight: 800;
        user-select: none;
    }
}

.topic {
    flex: 1 1 1rem;
}

.pagination {
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
        background-color: $dox-white;
    }

    span:hover, i:hover {
        color: $dox-white-ultra;
        background-color: $dox-grey-light;
    }

    .current {
        color: $dox-white;
        background-color: $dox-black;
    }

    .current:hover {
        background-color: $dox-grey-dark;
    }
}
</style>