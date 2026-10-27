<script setup lang="ts">
import EditorFrame from "./components/EditorFrame.vue"

const hints = useHints()
const valid = useValidation()

const title = ref<string>("")
const url = ref<string>("")
const content = ref<string>("")
const titleFocused = ref(false)
const urlFocused = ref(false)

const topics = useTopicManager()

function validTitle() {
    return valid.post.title(title.value)
}

function validUrl() {
    try {
        const parsed = new URL(url.value)
        return parsed.protocol === "http:" || parsed.protocol === "https:"
    }
    catch {
        return false
    }
}

const submitting = ref<boolean>(false)
async function submit() {
    if (!validTitle()) {
        hints.addWarning("Title is invalid.")
        return
    }
    if (!validUrl()) {
        hints.addWarning("Link URL is invalid.")
        return
    }
    if (topics.items.length == 0) {
        hints.addWarning("You must include at least one topic.")
        return
    }

    submitting.value = true
    hints.addMessage("Link publishing is not available yet.")
    submitting.value = false
}
</script>

<template>
    <EditorFrame title="New Link" unavailable>
        <template #form>
            <div class="field" :class="{ 'invalid': titleFocused && !validTitle() }">
                <label>Title</label>
                <input v-model="title" @focus="titleFocused = true" @blur="titleFocused = false" />
            </div>
            <div class="field" :class="{ 'invalid': urlFocused && !validUrl() }">
                <label>Link</label>
                <input type="url" v-model="url" @focus="urlFocused = true" @blur="urlFocused = false" />
            </div>
            <MarkdownEditor bounded class="f-1" label="Content" :rows="12" v-model="content" />
            <TopicField :topics="topics" />
        </template>
        <template #preview>
            <h1 class="mb-2">{{ title }}</h1>
            <a v-if="validUrl()" class="link-preview mb-3" :href="url" target="_blank" rel="noopener noreferrer">
                <i class="fa-solid fa-arrow-up-right-from-square"></i>
                <span class="text truncate">{{ url }}</span>
            </a>
            <Markdown class="content" :content="content" />
        </template>
    </EditorFrame>
</template>

<style scoped lang="scss">
a.link-preview {
    min-width: 0;
    color: $blue;
    font-weight: var(--fw-bold);
    text-decoration: none;
}
</style>