<script setup lang="ts">
import type { Report, Topic } from "@@/shared/types"

type ModeratorReport = Report & { topics: string[] }

const topics = await useAuthenticatedDatasource<Topic[]>("/api/moderator/topics")
const reports = await useAuthenticatedDatasource<ModeratorReport[]>("/api/moderator/reports")
</script>

<template>
    <article class="content-width column g-3 p-4">
        <ReportQueue
            v-if="topics.data.value && reports.data.value && topics.data.value.length > 0"
            :reports="reports.data.value"
            :topics="topics.data.value"
            @refresh="reports.refresh()"
        />
        <footer v-else-if="topics.data.value && reports.data.value" class="box empty-state">
            <p>You aren't moderating any topics.</p>
        </footer>
    </article>
</template>