<script setup lang="ts">
const hints = useHints()
const events = useEvents()
const session = getSession()

const { data: schema, refresh } = await useDatasource<string>("/api/developer/database/schema")

async function syncDatabase() {
    await useApi("/api/developer/database/sync")
    hints.addSuccess("Database synced. Logging Out...")
    
    setTimeout(() => {
        session.logout(true)
        events.publish(Trigger.toggleLogin)
    }, 2500)
}
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
            <Codeblock v-if="schema" language="sql" :code="schema" />
        </section>
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width(60rem, 1rem);
}
</style>