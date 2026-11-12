<script setup lang="ts">
import type { Post } from '@@/shared/types'

const props = defineProps<{
    post: Post
    pinned?: boolean
}>()
</script>

<template>
    <ContentVisibility :tags="post.tags">
        <div class="post clickable box background animate hover-shadow" :class="{'pinned': pinned }">
            <ContentVisibility v-if="post.replyTo && post.replyTo.id" :tags="post.replyTo.tags">
                <div class="reply-to row inline g-2 py-1 px-2" @click="navigateTo(`/post/${extractId(post.replyTo.id)}`)">
                    <i class="fa-solid fa-reply-all fa-flip-horizontal"></i>
                    <p class="text truncate bold">{{ post.replyTo.title }}</p>
                </div>
            </ContentVisibility>
            <div class="main box row g-2 p-3 text break" @click="navigateTo(`/post/${extractId(post.id)}`)">
                <div class="f-1">
                    <ContentHeader :content="post" context="preview" :pinned="pinned" />
                    <h3 class="title mt-2">
                        {{ post.title }}
                    </h3>
                </div>
                <img v-if="post.images[0]" class="br-medium" :src="post.images[0].url">
            </div>
        </div>
    </ContentVisibility>
</template>

<style scoped lang="scss">
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
}

img {
    max-width: 64px;
    max-height: 64px;
    aspect-ratio: 1 / 1;
    object-fit: cover;
    border: 1px solid $white-1;
}

.reply-to + .main {
    border-top-left-radius: 0;
    border-top-right-radius: 0;
}

.reply-to {
    color: $white-0;
    
    p {
        letter-spacing: 0.025rem;
    }
}
</style>