<script setup lang="ts">
import EditorFrame from "./components/EditorFrame.vue"

const hints = useHints()

const question = ref<string>("")
const responseType = ref<"radio" | "checkbox" | "input">("radio")
const responses = ref<string[]>(["", ""])
const questionFocused = ref(false)

const topics = useTopicManager()

function validQuestion() {
    const length = question.value.trim().length
    return length >= 4 && length <= 256
}

function addResponse() {
    responses.value.push("")
}

function removeResponse(index: number) {
    if (responses.value.length <= 2) {
        hints.addWarning("Polls need at least two responses.")
        return
    }
    responses.value.splice(index, 1)
}

function filledResponses() {
    return responses.value.filter(response => response.trim() !== "")
}

function validResponses() {
    return filledResponses().length >= 2
}

const submitting = ref<boolean>(false)
async function submit() {
    if (!validQuestion()) {
        hints.addError("Question must be 4-256 characters.")
        return
    }
    if (!validResponses()) {
        hints.addError("Polls need at least two responses.")
        return
    }
    if (topics.items.length == 0) {
        hints.addError("You must include at least one topic.")
        return
    }

    submitting.value = true
    hints.addWarning("Poll publishing is not available yet.")
    submitting.value = false
}
</script>

<template>
    <EditorFrame title="New Poll" :submitting="submitting" @submit="submit">
        <template #form>
            <div class="field" :class="{ 'invalid': questionFocused && !validQuestion() }">
                <label>Question</label>
                <textarea rows="4" v-model="question" @focus="questionFocused = true" @blur="questionFocused = false" />
            </div>
            <div class="field f-1">
                <label>Responses</label>
                <div class="row g-2 mb-2">
                    <button class="link b-0" @click="addResponse">
                        <i class="fa-solid fa-plus"></i>
                    </button>
                    <select class="f-1 b-0" v-model="responseType">
                        <option value="radio">Radio</option>
                        <option value="checkbox">Checkbox</option>
                        <option value="input">Input</option>
                    </select>
                </div>
                <div v-for="(response, index) in responses" class="row g-2 mb-2">
                    <button class="danger b-0" @click="removeResponse(index)">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                    <input class="f-1 b-0" type="text" v-model="responses[index]" />
                </div>
            </div>
            <TopicField :topics="topics" />
        </template>
        <template #preview>
            <h1 class="mb-3">{{ question }}</h1>
            <div class="poll-preview column g-2">
                <label v-for="response in filledResponses()" class="row inline g-2">
                    <input v-if="responseType === 'radio'" type="radio" disabled>
                    <input v-else-if="responseType === 'checkbox'" type="checkbox" disabled>
                    <input v-else type="text" disabled>
                    <span>{{ response }}</span>
                </label>
            </div>
        </template>
    </EditorFrame>
</template>
