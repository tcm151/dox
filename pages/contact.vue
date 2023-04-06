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
    <article class="column g-4 p-4">
        <section class="links p-5">
            <h1>Contact</h1>
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
        </section>
        <section class="feedback p-5">
            <h1>Submit Feedback</h1>
            <div class="field mt-2">
                <textarea v-model="feedback" rows="10"></textarea>
                <ClientOnly>
                    <div class="column mt-3" >
                        <button class="success" v-if="session.isAuthenticated" @click="submitFeedback">Submit</button>
                        <button class="negative" v-else>You must be logged in to submit feedback.</button>
                    </div>
                </ClientOnly>
            </div>
        </section>
    </article>
</template>

<style scoped lang="scss">
article.column {
    @include fit-width (500px, 1rem);
}

h1 {
    font-size: 1.5rem;
}

.links, .feedback {
    border-radius: 0.25rem;
    background-color: $dox-white-ultra;
}

.links {
    @include flex-v (0.5rem);
}
</style>