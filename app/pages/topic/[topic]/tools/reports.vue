<script setup lang="ts">
import type { Report } from '@@/shared/types'

const route = useRoute()
const session = getSession()
const hints = useHints()
const refreshing = ref(false)

const id = route.params.topic?.toString()
const { data: reports, pending, refresh: refreshReports } = await useAuthenticatedDatasource<Report[]>(`/api/topic/${id}/reports`)

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
    <article class="content-width p-4">
        <header class="row wrap inline between g-2">
            <h1>Reports</h1>
            <ButtonSpinner class="dark" :loading="pending || refreshing" @click="refresh()">
                <i class="fa-solid fa-rotate"></i>
                <span>Refresh</span>
            </ButtonSpinner>
        </header>
        <template v-if="reports">
            <ReportQueue class="mt-2" :reports="reports" @refresh="refresh()" />
        </template>
    </article>
</template>
