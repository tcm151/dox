<script setup lang="ts">
import type { Report } from "@@/shared/types"

const session = getSession()

const { data: reports, pending, refresh } = await useAuthenticatedDatasource<Report[]>("/api/moderator/reports")

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
        <ReportQueue v-if="reports" :reports="reports" :topics="session.moderator.topics" @refresh="refresh" />
        <section v-else class="box empty-state" aria-live="polite">
            <p>You aren't moderating any topics.</p>
        </section>
    </article>
</template>