<script setup lang="ts">
// TODO handle client errors as rigorously as server errors
function throwClientError() {
    throw createError({
        status: 500,
        statusText: "Example Server Error",
        cause: "This is the reason for the error",
        message: "This is additional messaging information that is available.",
        data: {
            id: 1,
            sql: "SELECT * FROM ALL",
        },
    })
}

async function throwServerError() {
    await useApi("/api/developer/error/throw")
}
</script>

<template>
    <article class="box m-4 p-5">
        <header class="row g-2">
            <button class="dark" @click="throwClientError">
                Client Error
            </button>
            <button class="dark" @click="throwServerError">
                Server Error
            </button>
        </header>
    </article>
</template>

<style scoped lang="scss">
article.box {
    @include fit-width(40rem, 1rem);
}
</style>