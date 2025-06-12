<script setup lang="ts">

</script>

<template>
    <article class="column g-4 p-4">
        <section class="box p-5">
            <h1>Contact</h1>
            <ul class="content">
                <li><a href="mailto:support@tcmdev.ca">support@tcmdev.ca</a></li>
                <li><a href="mailto:inquiries@tcmdev.ca">inquiries@tcmdev.ca</a></li>
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