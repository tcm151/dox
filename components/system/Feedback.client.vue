<script setup lang="ts">

const props = defineProps<{
    placeholder?: string
}>()

const emit = defineEmits<{
    (event: 'submit'): void
}>()

const hints = useHints()
const session = getSession()

let feedback = ref("")

let submitting = ref<boolean>(false)
async function submitFeedback() {
    if (feedback.value == "") {
        hints.addWarning("You can't submit nothing.")
        return
    }
    
    submitting.value = true
    await session.useApi("/api/feedback/submit", {
        user: session.user!.id,
            content: feedback.value,
            time: new Date(),
    })
    submitting.value = false

    feedback.value = ""
    emit('submit')
}
</script>

<template>
    <div class="field">
        <textarea rows="10" :placeholder="placeholder ?? ''" v-model="feedback"></textarea>
        <div class="column mt-3" >
            <ButtonSpinner class="success" v-if="session.isAuthenticated" :loading="submitting" @click="submitFeedback">
                Submit
            </ButtonSpinner>
            <button class="negative" v-else>
                You must be logged in to submit feedback.
            </button>
        </div>
    </div>
</template>