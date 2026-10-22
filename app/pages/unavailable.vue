<script setup lang="ts">
definePageMeta({ layout: false })
useHead({ title: "Service Unavailable" })

const route = useRoute()
const config = useRuntimeConfig()

const returnTo = computed(() => {
    const target = route.query.returnTo
    const path = Array.isArray(target) ? target[0] : target

    if (!path?.startsWith("/") || path.startsWith("//") || path.includes("\\")) {
        return "/"
    }

    return path
})

function retry() {
    window.location.assign(returnTo.value)
}
</script>

<template>
    <article class="error">
        <section class="details box column inline p-5">
            <div class="column g-2 mb-5">
                <h1>{{ config.public.site.title }} is Unavailable...</h1>
                <p>Something isn't working right and the service is unavailable. Please try again shortly.</p>
            </div>
            <div class="row g-2">
                <button class="success" type="button" @click="retry">
                    <i class="fa-solid fa-rotate-right"></i>
                    <span>Try Again</span>
                </button>
            </div>
        </section>
    </article>
</template>

<style scoped lang="scss">
article.error {
    height: 100%;
    display: grid;
    place-items: center;
    background-color: $white-1;

    section.details {
        @include fit-width(40em, 1rem);

        div {
            text-align: center;
        }
    }
}
</style>