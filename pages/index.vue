<script setup lang="ts">
import { Post } from '~~/types/types';

const { data: posts } = await useFetch<Post[]>("/api/posts");

const vote = useVoting();



const settings = useSettings();

</script>

<template>
    <div class="feed m-5">
        <div class="post" :class="{ 'animate': settings.state.hoverAnimations }" v-for="post in posts" :key="post.id">
            <h3 class="title mx-1 my-1" @click="navigateTo(`/post/${getId(post.id!)}`)">
                {{ post.title }}
            </h3>
            <div class="row g-1">
                <div class="votes row g-1">
                    <span class="upvote" @click="vote.upvote(post.votes)">{{ post?.votes.upvotes.length }}</span>
                    <span class="misleading" @click="vote.misleading(post.votes)">{{ post?.votes.misleading.length }}</span>
                    <span class="downvote" @click="vote.downvote(post.votes)">{{ post?.votes.downvotes.length }}</span>
                </div>
                <span class="topic" v-for="topic in post?.topics">
                    {{ topic }}
                </span>
                <span class="info">u/{{ post?.user.name ?? "deleted" }}</span>
                <span class="info" style="flex: 0 1">{{ post.comments.length }} comments</span>
                <span class="info" style="flex: 0 1">{{ formatDate(post.time as any) }}</span>
            </div>
        </div>
        <div class="pages">
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
    width: 750px;
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
    // transform: scale(102%, 102%);
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

.pages {
    @include flex-h (0.5rem);
    justify-content: center;

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