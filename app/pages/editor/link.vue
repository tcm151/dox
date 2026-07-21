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
        hints.addError("Title is invalid.")
        return
    }
    if (!validUrl()) {
        hints.addError("Link URL is invalid.")
        return
    }
    if (topics.items.length == 0) {
        hints.addError("You must include at least one topic.")
        return
    }

    submitting.value = true
    hints.addWarning("Link publishing is not available yet.")
    submitting.value = false
}
</script>

<template>
    <EditorFrame title="New Link" :submitting="submitting" @submit="submit">
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
            <a v-if="validUrl()" class="link-preview row inline g-2 mb-3" :href="url" target="_blank" rel="noopener noreferrer">
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
    font-weight: 700;
    text-decoration: none;
}
</style>