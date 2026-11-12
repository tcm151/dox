<script setup lang="ts">
import EditorFrame from "./components/EditorFrame.vue"
import UploadedImages from "./components/UploadedImages.vue"
import type { User, Thread } from '@@/shared/types'

const hints = useHints()
const session = getSession()

let newThread = ref<Thread>({
    id: '',
    user: session.user as User & string,
    content: '',
    tags: [],
    time: '',
    topics: [],
    quotes: [],
    replies: [],
    images: [],
    votes: {
        positive: [],
        misleading: [],
        negative: [],
        awards: [],
        saves: [],
    },
    score: 0,
    visits: 0,
    edited: false,
    deleted: false,
    status: "active",
})

const topics = useTopicManager()

const contentFocused = ref(false)
function validContent() {
    const length = newThread.value.content.trim().length
    return length >= 4 && length <= 512
}

const images = useImageUploader('editorImages')

const submitting = ref<boolean>(false)
async function submit() {
    if (!validContent()) {
        hints.addWarning("Thread content must be 4-512 characters.")
        return
    }
    if (topics.items.length == 0) {
        hints.addWarning("You must include at least one topic.")
        return
    }

    try {
        submitting.value = true
        const thread = await useApi<Thread>("/api/thread/add", {
            body: {
                user: session.user.id,
                content: newThread.value.content,
                tags: newThread.value.tags,
                topics: topics.items,
                votes: {
                    positive: [session.user.id],
                    misleading: [],
                    negative: [],
                },
                images: images.uploaded.map(i => i.id),
            }
        })

        images.uploaded = []
        return navigateTo(`/thread/${extractId(thread.id)}`)
    }
    catch (error: any) {
        hints.addError("Failed to submit thread.", error)
    }
    finally {
        submitting.value = false
    }
}

</script>

<template>
    <EditorFrame title="New Thread" :submitting="submitting" @submit="submit">
        <template #header-actions>
            <ContentTagSelector v-model="newThread.tags" />
        </template>
        <template #form>
            <UploadedImages size="small" :images="images" />
            <MarkdownEditor bounded label="Content" :rows="12" v-model="newThread.content" @focus="contentFocused = true" @blur="contentFocused = false" />
            <TopicField :topics="topics" />
        </template>
        <template #preview>
            <ContentVisibility :tags="newThread.tags" direct>
                <Markdown class="content" :content="newThread.content" />
                <aside v-if="images.uploaded.length > 0" class="preview-images row wrap g-2 mt-3">
                    <img v-for="image in images.uploaded" class="br-small border-subtle" :src="image.url">
                </aside>
            </ContentVisibility>
        </template>
        <template #footer-actions>
            <button class="link f-1 b-0" @click="images.select">
                <i class="fa-solid fa-images"></i>
                <span>Upload</span>
            </button>
        </template>
        <OverlayTransition>
            <MediaUploader v-if="images.files" :media="images.files" :loading="images.uploading" @upload="images.upload" @close="images.cancel" />
        </OverlayTransition>
    </EditorFrame>
</template>

<style scoped lang="scss">
aside.preview-images {
    img {
        max-height: 12rem;
        max-width: 100%;
        object-fit: contain;
        background-color: $white-1;
    }
}

</style>