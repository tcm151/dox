<script setup lang="ts">
import type { Report } from "@@/shared/types"

const session = getSession()
const hints = useHints()
const refreshing = ref(false)

const { data: reports, pending, status, refresh: refreshReports } = await useAuthenticatedDatasource<Report[]>("/api/moderator/reports")

async function refresh() {
    refreshing.value = true
    try {
        await Promise.all([
            refreshReports(),
            session.refreshProfile().catch(error => hints.addError("Unable to refresh your profile.", error)),
        ])
    }
    finally {
        refreshing.value = false
    }
}
</script>

<template>
    <article class="content-width column g-2 p-4">
        <header class="row wrap inline between g-2">
            <h1>Reports</h1>
            <ButtonSpinner class="dark" :loading="pending || refreshing" @click="refresh()">
                <i class="fa-solid fa-rotate"></i>
                <span>Refresh</span>
            </ButtonSpinner>
        </header>
        <ReportQueue v-if="reports" :reports="reports" :topics="session.user.topics.moderates" @refresh="refresh" />
        <section v-else-if="status === 'error'" class="box empty-state" role="alert">
            <p>Unable to load reports.</p>
        </section>
    </article>
</template>