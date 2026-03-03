<script setup lang="ts">
import type { Post, Comment } from '~/types'

const props = defineProps<{
    post: Post
    loading: string
}>()

const emit = defineEmits<{
    (event: 'refresh'): void
}>()

const cache = useCache()

const sortType = cache.get("comments.sortType", () => "new")
function sort(type: string) {
    sortType.value = type
    sortList(props.post.comments as Comment[], sortType.value)
}

const spinRefresh = ref(false)
watch(() => props.loading, (status) => {
    if (status == "pending") {
        spinRefresh.value = true
    }
    else {
        setTimeout(() => spinRefresh.value = false, 512)
    }
})

</script>

<template>
    <section class="comments p-5" v-if="post && post.comments.length > 0">
        <header class="sorting row g-1 mb-3">
            <button class="refresh dark" @click="emit('refresh')">
                <i class="fa-solid fa-rotate" :class="{ spin: spinRefresh }"></i>
            </button>
            <button class="fill" @click="sort('new')" :class="{ selected: sortType === 'new' }">
                <i class="fa-solid fa-egg"></i>
                <span>New</span>
            </button>
            <button class="fill" @click="sort('hot')" :class="{ selected: sortType === 'hot' }">
                <i class="fa-solid fa-fire"></i>
                <span>Hot</span>
            </button>
            <button class="fill" @click="sort('top')" :class="{ selected: sortType === 'top' }">
                <i class="fa-solid fa-ranking-star"></i>
                <span>Top</span>
            </button>
        </header>
        <Tree
            :items="post.comments ?? []"
            :children="(post.comments as Comment[]).filter(c => c.replyTo === post!.id) ?? []"
            :get-children="(comment: Comment, comments: Comment[]) => comments.filter(c => c.replyTo === comment.id)"
        >
            <template #item="{ item: comment }">
                <CommentPreview :comment="comment" :post="post" @refresh="emit('refresh')" />
            </template>
        </Tree>
    </section>
</template>

<style scoped lang="scss">
section.comments {
    border-radius: 0.5rem;
    background-color: $white-0;

    @media screen and (max-width: 600px) {
        padding: 1rem !important;
    }
}

header.sorting {
    button.refresh {
        i.spin {
            animation: spin 512ms linear infinite;
        }
    }

    button.selected {
        color: $white-0;
        background-color: $white-3;
    }
}
</style>