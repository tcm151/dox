<script setup lang="ts">

const session = getSession()

async function syncDatabase() {
    const result = await session.useApi("/api/developer/database/sync")
}

const schema = ref<string | null>("")
async function downloadSchema() {
    schema.value = await session.useApi<string>("/api/developer/database/schema")
}

</script>

<template>
    <article class="p-4" style="overflow-y: hidden;">
        <header class="box row g-2 p-4">
            <button class="danger" @click="syncDatabase">
                <i class="fa-solid fa-rotate" />
                <span>Sync Database</span>
            </button>
            <button class="link" @click="downloadSchema">
                <i class="fa-solid fa-cloud-arrow-down" />
                <span>Download Schema</span>
            </button>
        </header>
        <section style="overflow-y: auto;">
            <pre style="overflow-x: hidden; white-space: pre-wrap;">{{ schema }}</pre>
        </section>
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width(800px, 1rem);
}
</style>