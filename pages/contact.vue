<script setup lang="ts">
const settings = useSettings()
</script>

<template>
    <article class="column g-4 p-4">
        <section class="box p-5">
            <h1>Contact</h1>
            <ul class="content">
                <li>
                    <a :href="`mailto:${settings.app.email.support}`">
                        {{ settings.app.email.support }}
                    </a>
                </li>
            </ul>
        </section>
        <section class="box p-5">
            <h1 class="mb-2">Submit Feedback</h1>
            <Feedback placeholder="Let us know what you think..."/>
        </section>
    </article>
</template>

<style scoped lang="scss">
article.column {
    @include fit-width (500px, 1rem);
}

ul {
    margin-left: -1rem;
}
</style>