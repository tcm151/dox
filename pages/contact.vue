<script setup lang="ts">
const session = getSession();

let feedback = ref("");

async function submitFeedback() {
    const result = session.useApi("/api/feedback/submit", {
        user: session.user!.id,
            content: feedback.value,
            time: new Date(),
    })

    feedback.value = "";
}
</script>

<template>
    <div class="column g-5">
        <div class="links p-5">
            <h1 class="">Contact</h1>
            <div class="content column g-2">
                <div>
                    <span>General: </span>
                    <a href="mailto:contact@tcmdev.ca">contact@tcmdev.ca</a>
                </div>
                <div>
                    <span>Business: </span>
                    <a href="mailto:inquiries@tcmdev.ca">inquiries@tcmdev.ca</a>
                </div>
            </div>
        </div>
        <div class="feedback p-5">
            <h1>Submit Feedback</h1>
            <div class="field mt-2">
                <textarea v-model="feedback" rows="10"></textarea>
                <ClientOnly>
                    <div class="row mt-2" v-if="session.isAuthenticated">
                        <button class="success" @click="submitFeedback">Submit</button>
                    </div>
                    <div class="row mt-2" v-else>
                        <button class="negative">You must be logged in to submit feedback.</button>
                    </div>
                </ClientOnly>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
.column {
    @include fill-width(512px);
}

.links, .feedback {
    border-radius: 0.25rem;
    background-color: $dox-white-ultra;
}

.links {
    @include flex-v (0.5rem);
}
</style>