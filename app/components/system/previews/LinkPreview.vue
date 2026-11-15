<script setup lang="ts">
import type { Link } from "@@/shared/types"

const props = withDefaults(defineProps<{
    link: Link
    pinned?: boolean
    loading?: boolean
    interactive?: boolean
}>(), {
    loading: false,
    interactive: true,
})

const thumbnailSize = ref({ width: "96px", height: "72px" })

const preview = computed(() => props.link.preview)
const url = computed(() => props.link.url)
const displayTitle = computed(() => props.link.title || props.link.preview.title || "")
const displayDescription = computed(() => props.link.description?.trim() || preview.value.description)

const domain = computed(() => {
    try {
        return new URL(url.value).hostname.replace(/^www\./i, "")
    }
    catch {
        return url.value
    }
})

const imageUrl = computed(() => {
    if (!preview.value.imageUrl) return

    try {
        const image = new URL(preview.value.imageUrl)
        if (image.protocol !== "https:" || image.username || image.password || image.port) return
        return image.href
    }
    catch {
        return
    }
})

function updateThumbnailSize(event: Event) {
    const image = event.currentTarget as HTMLImageElement
    if (!image.naturalWidth || !image.naturalHeight) return

    const aspectRatio = Math.min(16 / 9, Math.max(9 / 16, image.naturalWidth / image.naturalHeight))
    const width = Math.min(128, 96 * aspectRatio)
    const height = width / aspectRatio
    thumbnailSize.value = { width: `${width}px`, height: `${height}px` }
}

function openLink() {
    if (props.interactive) navigateTo(`/link/${extractId(props.link.id)}`)
}
</script>

<template>
    <ContentVisibility :tags="link.tags">
        <article
            class="link-preview box background animate hover-shadow"
            :class="{ pinned }"
            :aria-busy="loading"
            aria-label="Link preview"
        >
            <div class="main box column g-2 p-3 text break" :class="{ clickable: interactive }" @click="openLink">
                <ContentHeader :content="link" context="preview" :pinned="pinned" :inert="!interactive" />
                <div class="content-row row inline start g-2">
                    <div class="details f-1">
                        <h3 v-if="displayTitle" class="title text left">{{ displayTitle }}</h3>
                        <p v-if="displayDescription || url" class="description mt-1">
                            <span v-if="displayDescription" class="mr-3">{{ displayDescription }} </span>
                            <a v-if="url" class="destination" :href="url" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer" @click.stop>
                                <i class="fa-solid fa-arrow-up-right-from-square mr-1"></i>
                                {{ domain }}
                            </a>
                        </p>
                        <p v-if="loading" class="loading muted mt-1" role="status">Loading preview...</p>
                    </div>
                    <img
                        v-if="imageUrl"
                        class="thumbnail br-medium border-subtle"
                        :src="imageUrl"
                        :alt="displayTitle || `${domain} preview image`"
                        loading="lazy"
                        decoding="async"
                        referrerpolicy="no-referrer"
                        :style="thumbnailSize"
                        @load="updateThumbnailSize"
                    >
                    <div v-else class="thumbnail br-medium placeholder grid center border-subtle" aria-hidden="true">
                        <i class="fa-solid fa-link"></i>
                    </div>
                </div>
            </div>
        </article>
    </ContentVisibility>
</template>

<style scoped lang="scss">
.link-preview {
    min-width: 0;

    &.pinned .main {
        border: 2px solid $white-2;
    }

    .main {
        min-width: 0;
        overflow: hidden;
        white-space: normal;
    }

    .details {
        min-width: 0;
    }

    .title {
        color: $black-0;
    }

    a.destination {
        display: inline-block;
        overflow-wrap: anywhere;
        color: $blue;
        font-size: 0.75rem;
        font-weight: var(--fw-bold);
        text-decoration: none;
        row-gap: 0.1rem;

        &:visited {
            color: $purple;
        }

        i {
            font-size: 0.8rem;
        }
    }

    .description {
        color: $white-3;
        font-size: 0.875rem;
        line-clamp: 3;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 3;
        overflow: hidden;
    }

    .thumbnail {
        flex: 0 0 auto;
        object-fit: contain;
    }

    .placeholder {
        flex: 0 0 96px;
        width: 96px;
        height: 72px;
        box-sizing: border-box;
        background: $white-4;
        color: $white-2;
    }
}
</style>
