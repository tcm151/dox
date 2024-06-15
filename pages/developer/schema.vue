<script setup lang="ts">

const hints = useHints()
const session = getSession()

async function syncDatabase() {
    try {
        await session.useApi("/api/developer/database/sync")
        hints.addSuccess("Database synced.")
    }
    catch (ex: any) {
        hints.addError("Failed to sync database.")
        hints.addError(ex.toString())
    }
}

const { data: schema, refresh } = useAsyncData("schema", () => {
    return $fetch<string[]>("/api/developer/database/schema")
})
</script>

<template>
    <article class="p-4">
        <section class="box column g-2 p-4">
            <header class="row g-2">
                <button class="danger fill" @click="syncDatabase">
                    <i class="fa-solid fa-cloud-arrow-down" />
                    <span>Sync Database</span>
                </button>
                <button class="link fill" @click="refresh()">
                    <i class="fa-solid fa-cloud-arrow-down" />
                    <span>Refresh Schema</span>
                </button>
            </header>
            <Codeblock v-if="schema"
                :wrap="true"
                language="json"
                :code="JSON.stringify(schema, undefined, 4)"
            />
        </section>
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width(60rem, 1rem);
}
</style>