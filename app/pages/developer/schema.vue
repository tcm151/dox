<script setup lang="ts">
const hints = useHints()
const events = useEvents()
const session = getSession()

const { data: schema, pending, refresh } = await useAuthenticatedDatasource<string>("/api/developer/database/schema")
const syncing = ref(false)

async function syncDatabase() {
    syncing.value = true
    try {
        await useApi("/api/developer/database/sync")
        hints.addSuccess("Database synced.")
    }
    finally {
        syncing.value = false
    }
}

const loading = ref(false)
async function replayMigration() {
    loading.value = true
    try {
        const result = await useApi<{ version: string }>("/api/developer/database/replay")
        await refresh()
        hints.addSuccess(`Migration ${result.version} replayed.`)
    }
    finally {
        loading.value = false
    }
}
</script>

<template>
    <article class="content-width column g-2 p-4">
        <header class="row wrap inline between">
            <h1>Schema</h1>
            <div class="row g-2">
                <ButtonSpinner class="danger" :loading="syncing" @click="syncDatabase">
                    <i class="fa-solid fa-cloud-arrow-down" />
                    <span>Sync</span>
                </ButtonSpinner>
                <ButtonSpinner class="dark" :loading="pending" @click="refresh()">
                    <i class="fa-solid fa-rotate"></i>
                    <span>Refresh</span>
                </ButtonSpinner>
            </div>
        </header>
        <section class="box column g-2 p-4">
            <Codeblock v-if="schema" language="sql" :code="schema" />
        </section>
    </article>
</template>
