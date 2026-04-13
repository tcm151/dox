<script setup lang="ts">
import type { User, Thread } from '@@/shared/types'

const hints = useHints()
const cache = useCache()
const session = getSession()

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
        const thread = await useApi<Thread>("/api/thread/add", {
        })
        return navigateTo(`/thread/${extractId(thread.id)}`)
    }
    catch (error: any) {
        hints.addError("Failed to submit thread.")
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
                <h1>New Poll</h1>
                <button @click="">
                    <i class="fa-solid fa-compass-drafting"></i>
                    <span>Drafts</span>
                </button>
            </header>
            <section class="form f-1 column g-2">
                <div class="field f-1">
                    <label>Question</label>
                    <textarea class="f-1" rows="3" />
                </div>
                <div class="field f-1">
                    <label>Responses</label>
                    <div class="row g-2">
                        <button class="link">
                            <i class="fa-solid fa-plus"></i>
                        </button>
                        <select class="f-1 b-0">
                            <option>Radio</option>
                            <option>Checkbox</option>
                            <option>Input</option>
                        </select>
                        <input class="f-4 b-0" type="text" />
                    </div> 
                    
                </div>
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