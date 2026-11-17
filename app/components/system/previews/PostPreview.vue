<script setup lang="ts">
import type { Post } from '@@/shared/types'

const props = defineProps<{
    post: Post
    pinned?: boolean
}>()

const thumbnailSize = ref({ width: '96px', height: '72px' })

const contentPreview = computed(() => {
    const text = renderMarkdownText(props.post.content ?? "")
    return (text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? []).slice(0, 3).join("").trim()
})

function updateThumbnailSize(event: Event) {
    const image = event.currentTarget as HTMLImageElement
    if (!image.naturalWidth || !image.naturalHeight) return

    const aspectRatio = Math.min(16 / 9, Math.max(9 / 16, image.naturalWidth / image.naturalHeight))
    const width = Math.min(128, 96 * aspectRatio)
    const height = width / aspectRatio
    thumbnailSize.value = { width: `${width}px`, height: `${height}px` }
}
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
            <div class="main box column g-2 p-3 text break" @click="navigateTo(`/post/${extractId(post.id)}`)">
                <ContentHeader :content="post" :pinned="pinned" />
                <div class="content-row row inline start g-2">
                    <div class="details f-1">
                        <h3 class="title">
                            {{ post.title }}
                        </h3>
                        <p class="description content-preview mt-1">{{ contentPreview }}</p>
                    </div>
                    <img
                        v-if="post.images[0]"
                        class="thumbnail br-medium border-subtle"
                        :src="post.images[0].url"
                        :alt="post.title"
                        loading="lazy"
                        decoding="async"
                        :style="thumbnailSize"
                        @load="updateThumbnailSize"
                    >
                </div>
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
    min-width: 0;
    overflow: hidden;
}

.content-row, .details {
    min-width: 0;
}

.content-preview {
    line-clamp: 3;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    overflow: hidden;
}

.description {
    color: $white-3;
    font-size: 0.875rem;
}

.thumbnail {
    flex: 0 0 auto;
    object-fit: contain;
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