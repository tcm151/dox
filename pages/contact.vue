<script setup lang="ts">

</script>

<template>
    <article class="column g-4 p-4">
        <section class="links column g-4 p-5">
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
            <h1 class="mb-2">Submit Feedback</h1>
            <Feedback placeholder="Let us know what you think..."/>
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

section.links, section.feedback {
    border-radius: 0.25rem;
    background-color: $dox-white-0;
}
</style>