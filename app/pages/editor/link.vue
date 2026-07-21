<script setup lang="ts">
import type { User, Thread } from '@@/shared/types'

const hints = useHints()
const cache = useCache()
const session = getSession()

const title = ref<string>("")
const url = ref<string>("")
const content = ref<string>("")

const newTopic = ref<string>("")
const topics = ref<string[]>([])
function addTopic(topic: string) {
    topics.value.push(`topic:${topic}`)
    newTopic.value = ""
}

function removeTopic(topic: string) {
    topics.value = topics.value.filter(t => t !== topic)
}

const submitting = ref<boolean>(false)
async function submit() {
    try {
        submitting.value = true
        const link = await useApi<Thread>("/api/link/add", {
        })
        return navigateTo(`/thread/${extractId(link.id)}`)
    }
    catch (error: any) {
        hints.addError("Failed to submit link.")
    }
    finally {
        submitting.value = false
    }
}

</script>

<template>
    <article class="column m-4">
        <section class="box column p-5">
            <header class="row inline between mb-4">
                <h1>New Link</h1>
                <button @click="">
                    <i class="fa-solid fa-compass-drafting"></i>
                    <span>Drafts</span>
                </button>
            </header>
            <section class="form f-1 column g-2">
                <div class="field">
                    <label>Title</label>
                    <input v-model="title" />
                </div>
                <div class="field">
                    <label>Link</label>
                    <input v-model="url" />
                </div>
                <MarkdownEditor bounded class="f-1" label="Content" :rows="6" v-model="content" />
                <TopicField v-model:text="newTopic" :topics="topics" @add="addTopic" @remove="removeTopic" />
            </section>
            <footer class="row g-2 mt-5">
                <ButtonSpinner class="success f-1 b-0" :loading="submitting" @click="submit">
                    <i class="fa-solid fa-share"></i>
                    <span>Submit</span>
                </ButtonSpinner>
            </footer>
        </section>
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width (60rem, 1rem);
}
</style>