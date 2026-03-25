<script setup lang="ts">
const settings = useSettings()
</script>

<template>
    <article class="column m-4 fit-medium">
        <section class="box column g-4 p-5">
            <div>
                <h1>Contact</h1>
                <ul class="content">
                    <li v-if="settings.app.email.support != ''">
                        <a :href="`mailto:${settings.app.email.support}`">
                            {{ settings.app.email.support }}
                        </a>
                    </li>
                    <li v-else>
                        No contact emails have been configured yet.
                    </li>
                </ul>

            </div>
            <div>
                <h1 class="mb-3">Feedback</h1>
                <Feedback placeholder="Let us know what you think..."/>
            </div>
        </section>
    </article>
</template>

<style scoped lang="scss">
ul {
    margin-left: -1rem;
}
</style>