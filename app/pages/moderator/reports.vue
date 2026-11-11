<script setup lang="ts">
import type { Report, Topic } from "@@/shared/types"

type ModeratorReport = Report & { topics: string[] }

const topics = await useAuthenticatedDatasource<Topic[]>("/api/moderator/topics")
const reports = await useAuthenticatedDatasource<ModeratorReport[]>("/api/moderator/reports")
const pending = computed(() => topics.pending.value || reports.pending.value)

async function refresh() {
    await Promise.all([topics.refresh(), reports.refresh()])
}
</script>

<template>
    <article class="content-width column g-2 p-4">
        <header class="row wrap inline between g-2">
            <h1>Reports</h1>
            <ButtonSpinner class="dark" :loading="pending" @click="refresh()">
                <i class="fa-solid fa-rotate"></i>
                <span>Refresh</span>
            </ButtonSpinner>
        </header>
        <ReportQueue
            v-if="topics.data.value && reports.data.value && topics.data.value.length > 0"
            :reports="reports.data.value"
            :topics="topics.data.value"
            @refresh="refresh()"
        />
        <section v-else-if="topics.data.value && reports.data.value" class="box empty-state" aria-live="polite">
            <p>You aren't moderating any topics.</p>
        </section>
    </article>
</template>