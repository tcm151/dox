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
    <article class="column g-2 p-4" style="overflow-y: hidden;">
        <header class="box row g-2 p-4">
            <button class="danger fill" @click="syncDatabase">
                <i class="fa-solid fa-rotate" />
                <span>Sync Database</span>
            </button>
            <button class="link fill" @click="downloadSchema">
                <i class="fa-solid fa-cloud-arrow-down" />
                <span>Download Schema</span>
            </button>
        </header>
        <section class="box px-4" v-if="schema">
            <Codeblock
                :wrap="true"
                language="javascript"
                :code="JSON.stringify(schema, undefined, 4)"
            />
        </section>
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width(800px, 1rem);
}
</style>