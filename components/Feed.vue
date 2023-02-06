<script setup lang="ts">
import { Post } from "~/types/types";

const props = defineProps<{ posts: Post[] }>()

const vote = useVoting();
const sorting = useSorting();
const session = getSession();
const settings = useSettings();

onMounted(() => sorting.sortBy(props.posts, "hot"))
// onBeforeMount(() => sorting.sortBy(props.posts, "hot"))

</script>

<template>
    <div class="feed">
        <div class="row g-2">
            <button @click="sorting.sortBy(posts, 'new')">New</button>
            <button @click="sorting.sortBy(posts, 'hot')">Hot</button>
            <button @click="sorting.sortBy(posts, 'top')">Top</button>
        </div>
        <div class="post" :class="{ 'animate': settings.state.hoverAnimations }" v-for="post in posts" :key="post.id">
            <h3 class="title mx-1 my-1" @click="navigateTo(`/post/${getId(post.id!)}`)">
                {{ post.title }}
            </h3>
            <div class="row-wrap g-1">
                <div class="votes row g-1">
                    <span class="positive" @click="vote.positive(post.id, post.votes)">{{ post?.votes.positive.length }}</span>
                    <span class="misleading" @click="vote.misleading(post.id, post.votes)">{{ post?.votes.misleading.length }}</span>
                    <span class="negative" @click="vote.negative(post.id, post.votes)">{{ post?.votes.negative.length }}</span>
                </div>
                <span class="topic" v-for="topic in post?.topics" @click="navigateTo(`/topic/${topic}`)">
                    {{ topic }}
                </span>
                <div class="details row g-1">
                    <span class="info" @click="navigateTo(`/user/${getId(post.user.id)}`)">u/{{ post?.user.name ?? "deleted" }}</span>
                    <span class="info">{{ post.comments.length }} comments</span>
                    <span class="info">{{ formatDate(post.time as any) }}</span>
                </div>
            </div>
        </div>
        <div class="pagination mt-3">
            <div class="start">
                <i class="fa-solid fa-rotate-left"></i>
            </div>
            <div class="previous">
                <i class="fa-solid fa-chevron-left"></i>
            </div>
            <div class="pages">
                <div>1</div>
                <div>2</div>
                <div>3</div>
                <i class="fa-solid fa-ellipsis"></i>
            </div>
            <div class="next">
                <i class="fa-solid fa-chevron-right"></i>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
@import "~/assets/global.scss";

.feed {
    @include flex-v (0.5rem);
}

.post {
    padding: 0.25rem 0.5rem 0.5rem 0.5rem;
    border-radius: 0.25rem;
    background-color: $dox-white-ultra;
    transition: transform 128ms;
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

span {
    padding: 0.25rem 1rem;

    font-size: 0.8rem;
    font-weight: 700;
    text-align: center;

    outline: 1px transparent;
    border-radius: 0.25rem;
    background-color: #EEE;

    transition: background-color 64ms;
}

span:hover {
    background-color: whitesmoke;
}

.pagination {
    @include flex-h (0.5rem);
    justify-content: center;

    .pages {
        @include flex-h (0.5rem);
        justify-content: center;
    }

    .start, .previous, .next, .pages > * {
        width: 2rem;
        padding: 0.25rem 0;
        font-weight: 600;
        text-align: center;
        line-height: 20px;
        border-radius: 0.25rem;
        background-color: $dox-white-ultra;
    }

    .start:hover, .previous:hover, .next:hover, .pages > *:hover {
        background-color: whitesmoke;
    }
}
</style>