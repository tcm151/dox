<script setup lang="ts">

const props = defineProps<{
    placeholder?: string
}>()

const emit = defineEmits<{
    (event: 'submit'): void
}>()

const session = getSession();

let feedback = ref("");

async function submitFeedback() {
    const result = await session.useApi("/api/feedback/submit", {
        user: session.user!.id,
            content: feedback.value,
            time: new Date(),
    })

    feedback.value = "";
    emit('submit')
}
</script>

<template>
    <div class="field">
        <textarea rows="10" :placeholder="placeholder ?? ''" v-model="feedback"></textarea>
        <ClientOnly>
            <div class="column mt-3" >
                <button class="success" v-if="session.isAuthenticated" @click="submitFeedback">Submit</button>
                <button class="negative" v-else>You must be logged in to submit feedback.</button>
            </div>
        </ClientOnly>
    </div>
</template>

<style scoped lang="scss">
h1 {
    font-size: 1.5rem;
}

textarea::placeholder {
    color: $dox-white;
    font-style: italic;
}
</style>