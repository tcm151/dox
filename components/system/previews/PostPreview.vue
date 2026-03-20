<script setup lang="ts">
import type { Post, User, Image } from '~/types'

const props = defineProps<{
    post: Post
    pinned?: boolean
}>()

</script>

<template>
    <div class="post" :class="{'pinned': pinned }">
        <div class="reply-to row center-inline g-2" v-if="(post.replyTo as Post).id != null" @click="navigateTo(`/post/${extractId((post.replyTo as Post).id)}`)">
            <i class="fa-solid fa-reply-all fa-flip-horizontal"></i>
            <p>{{ (post.replyTo as Post).title }}</p>
        </div>
        <div class="main box row g-2 p-3" @click="navigateTo(`/post/${extractId(post.id)}`)">
            <div class="fill">
                <div class="row-wrap g-1">
                    <Votes :target="post" />
                    <div class="f-1 row-wrap g-1">
                        <Tag class="f-1" type="info" icon="fa-chart-simple" :label="post.visits ?? 0" />
                        <Tag class="f-1" type="info" icon="fa-message" :label="post.comments.length.toString()" />
                        <UserTag class="f-1" :user="(post.user as User)" />
                        <DurationTag class="f-1" :time="post.time" />
                    </div>
                    <Tag v-if="pinned" type="link" icon="fa-thumbtack" />
                    <Tag v-if="post.archived" type="link" icon="fa-folder-closed" />
                    <Tag v-if="post.votes.awards.length > 0" type="link" :label="post.votes.awards.length" icon="fa-crown" />
                    <Tag v-if="post.votes.saves.length > 0" type="link" :label="post.votes.saves.length" icon="fa-box-archive" />
                    <div class="f-1 row-wrap g-1">
                        <TopicTag v-for="topic in post.topics" class="f-10" :topic="topic" />
                    </div>
                </div>
                <h3 class="title mt-2">
                    {{ post.title }}
                </h3>
            </div>
            <img v-if="post.images[0]" :src="(post.images[0] as Image).url">
        </div>
    </div>
</template>

<style scoped lang="scss">
.post:hover {
    @include shadow(1px, $blur: 0.25rem, $spread: 0.25rem, $color: #CCC1);
}

.post.animate:hover {
    transform: scale(102%, 105%);
    transition: transform 128ms;
}

.post {
    cursor: pointer;
    border-radius: 0.25rem;
    background-color: $white-3;
}

.post:has(.reply-to:hover)  {
    background-color: $white-4;
}

.post.pinned {
    .main {
        border: 2px solid $white-2;
    }
}
    
.post:has(.reply-to)  {
    .main {
        border-top: none;
    }
}

.main {
    overflow: hidden;
    white-space: break-spaces;
}

img {
    max-width: 64px;
    max-height: 64px;
    aspect-ratio: 1 / 1;
    object-fit: cover;
    border-radius: 0.5rem;
    border: 1px solid $white-1;
}

.reply-to + .main {
    border-top-left-radius: 0;
    border-top-right-radius: 0;
}

.reply-to {
    padding: 0.25rem 0.5rem 0.25rem 0.5rem;
    color: $white-0;
    
    p {
        overflow-x: hidden;
        text-overflow: ellipsis;
        font-weight: 700;
        letter-spacing: 0.025rem;
    }
}
</style>