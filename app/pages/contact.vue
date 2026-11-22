<script setup lang="ts">
const settings = useSettings()

const additionalEmails = computed(() => {
    return settings.app.email.additional.split(";")
})
</script>

<template>
    <article class="column m-4">
        <section class="box column g-4 p-5">
            <div>
                <h1>Contact</h1>
                <ul class="content">
                    <li v-if="settings.app.email.support != ''" class="mb-2">
                        <a :href="`mailto:${settings.app.email.support}`">
                            {{ settings.app.email.support }}
                        </a>
                    </li>
                    <li v-else class="mb-2">
                        No contact emails have been configured yet.
                    </li>
                    <!-- TODO showing when no emails have been configured -->
                    <template v-for="email in additionalEmails">
                        <li class="mb-2">
                            <a :href="`mailto:${email}`">
                                {{ email }}
                            </a>
                        </li>
                    </template>
                </ul>

            </div>
            <div v-if="settings.app.misc.feedback.enabled">
                <h1 class="mb-3">Feedback</h1>
                <Feedback placeholder="Let us know what you think..."/>
            </div>
        </section>
    </article>
</template>

<style scoped lang="scss">
article.column {
    @include fit-width (40rem, 1rem);
}

ul {
    margin-left: -1rem;
}
</style>