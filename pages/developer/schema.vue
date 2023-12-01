<script setup lang="ts">

const cache = useCache()
const hints = useHints()
const session = getSession()

async function syncDatabase() {
    try {
        await session.useApi("/api/developer/database/sync")
        hints.addSuccess("Database synced.")
    }
    catch {
        hints.addError("Failed to sync database.")
    }
}

const schema = cache.get<string | null>("developer.schema.download", () => "")
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