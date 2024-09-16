<script setup lang="ts">

const session = getSession()

async function database(endpoint: string) {
    console.log(await $fetch(`https://db.tcmdev.ca/${endpoint}`))
}

async function authenticate() {
    const result = await session.useApi("/api/profile/authenticate")
    console.log(result)
}
</script>

<template>
    <article class="p-4">
        <header class="row g-2">
            <button @click="database('status')">
                Status
            </button>
            <button @click="database('health')">
                Health
            </button>
            <button @click="database('version')">
                Version
            </button>
            <button @click="authenticate">
                Authenticate
            </button>
        </header>
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width(60rem, 1rem);
}
</style>