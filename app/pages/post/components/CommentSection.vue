<script setup lang="ts">
import type { Post, Gallery, Comment } from '@@/shared/types'
import ExtraOptions from "./ExtraOptions.vue"

const session = getSession()
const events = useEvents()
const hints = useHints()

const props = defineProps<{
    target: Post | Gallery
    sortType: string
    loading: string
}>()

const emit = defineEmits<{
    (event: 'refresh', sortBy: string): void
}>()

const selectedComment = ref<Comment>()
const editingCommentId = ref<string>()
const canShowCommentOptions = computed(() => session.isAuthenticated
    && selectedComment.value
    && !selectedComment.value.deleted
    && selectedComment.value.status === "active")

function closeCommentOptions() {
    selectedComment.value = undefined
}

function startEditingComment() {
    if (selectedComment.value) editingCommentId.value = selectedComment.value.id
}

function finishEditingComment() {
    editingCommentId.value = undefined
}

async function deleteSelectedComment() {
    const comment = selectedComment.value
    if (!comment) return

    try {
        await useApi(`/api/comment/${extractId(comment.id)}/delete`)
        emit("refresh", props.sortType)
    }
    catch (error: any) {
        hints.addError(error.message, error)
    }
}

function reportSelectedComment() {
    if (selectedComment.value) events.publish(Trigger.reportContent, selectedComment.value.id)
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
    <section v-if="target && target.comments.length > 0" class="comments br-medium p-5">
        <header class="sorting row g-1 mb-3">
            <button class="refresh dark" @click="emit('refresh', sortType)">
                <i class="fa-solid fa-rotate" :class="{ spin: spinRefresh }"></i>
            </button>
            <button class="f-1" @click="emit('refresh', 'new')" :class="{ selected: sortType === 'new' }">
                <i class="fa-solid fa-egg"></i>
                <span>New</span>
            </button>
            <button class="f-1" @click="emit('refresh', 'hot')" :class="{ selected: sortType === 'hot' }">
                <i class="fa-solid fa-fire"></i>
                <span>Hot</span>
            </button>
            <button class="f-1" @click="emit('refresh', 'top')" :class="{ selected: sortType === 'top' }">
                <i class="fa-solid fa-ranking-star"></i>
                <span>Top</span>
            </button>
        </header>
        <Tree
            :items="target.comments ?? []"
            :children="(target.comments as Comment[]).filter(c => c.replyTo === target.id) ?? []"
            :get-children="(comment: Comment, comments: Comment[]) => comments.filter(c => c.replyTo === comment.id)"
        >
            <template #item="{ item: comment }">
                <CommentPreview
                    :comment="comment"
                    :discussion="target"
                    :editing="editingCommentId === comment.id"
                    @refresh="emit('refresh', sortType)"
                    @options="selectedComment = $event"
                    @finish-edit="finishEditingComment"
                />
            </template>
        </Tree>
        <OverlayTransition>
            <ExtraOptions
                v-if="canShowCommentOptions && selectedComment"
                :target="selectedComment"
                @updated="emit('refresh', sortType)"
                @edit="startEditingComment"
                @delete="deleteSelectedComment"
                @report="reportSelectedComment"
                @close="closeCommentOptions"
            />
        </OverlayTransition>
    </section>
</template>

<style scoped lang="scss">
section.comments {
    background-color: $white-0;

    @media (max-width: $bp-tablet) {
        padding: 1rem !important;
    }
}

header.sorting {
    button.selected {
        color: $white-0;
        background-color: $white-3;
    }
}
</style>