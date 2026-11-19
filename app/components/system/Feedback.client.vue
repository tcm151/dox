<script setup lang="ts">

const props = defineProps<{
    placeholder?: string
}>()

const emit = defineEmits<{
    (event: 'submit'): void
}>()

const hints = useHints()
const session = getSession()
const settings = useSettings()

let feedback = ref("")

let submitting = ref<boolean>(false)
async function submitFeedback() {
    if (submitting.value) return

    if (feedback.value == "") {
        hints.addWarning("You can't submit nothing.")
        return
    }
    
    submitting.value = true
    try {
        await useApi("/api/feedback/submit", {
            body: {
                content: feedback.value,
            }
        })

        feedback.value = ""
        emit('submit')
    }
    catch (error: unknown) {
        hints.addError(error instanceof Error ? error.message : "Unable to submit feedback.", error)
    }
    finally {
        submitting.value = false
    }
}
</script>

<template>
    <div class="field">
        <textarea rows="10" :placeholder="placeholder ?? ''" v-model="feedback"></textarea>
        <div class="column mt-3" >
            <ButtonSpinner v-if="settings.app.misc.feedback.enabled && (session.isAuthenticated || settings.app.misc.feedback.allowAnonymous)" class="success" :loading="submitting" @click="submitFeedback">
                Submit
            </ButtonSpinner>
            <button v-else class="negative">
                {{ settings.app.misc.feedback.enabled ? "You must be logged in to submit feedback." : "Feedback is currently disabled." }}
            </button>
        </div>
    </div>
</template>