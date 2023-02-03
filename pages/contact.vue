<script setup lang="ts">
const session = getSession();

let feedback = ref("");

function submitFeedback() {
    const { data: response } = useFetch("/api/feedback/submit", {
        method: "POST",
        body: {
            user: session.user!.id,
            content: feedback.value,
            time: new Date(),
        }
    });

    feedback.value = "";
}
</script>

<template>
    <div class="contact column g-5 m-5 p-5">
        <div class="links mt">
            <h1 class="">Contact</h1>
            <div class="content">
                <span>Email: </span><a href="mailto:contact@tcmdev.ca">contact@tcmdev.ca</a>
            </div>
        </div>
        <div class="feedback">
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
@import "~/assets/global.scss";

.contact {
    border-radius: 0.25rem;
    background-color: $dox-white-ultra;
}

.links {
    @include flex-v (0.5rem);
    width: 256px;
}
.feedback {
    width: 512px;
}
</style>