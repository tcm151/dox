<script setup lang="ts">
import type { Report } from '@@/shared/types'

const route = useRoute()

const id = route.params.topic?.toString()
const topicScope = id ? [{ id: `topic:${id}` }] : []
const { data: topic } = useNuxtData<Topic>(`topic:${id}`)
const { data: reports, pending, refresh } = await useAuthenticatedDatasource<Report[]>(`/api/topic/${id}/reports`)
</script>
    
<template>
    <article class="content-width p-4">
        <header class="row wrap inline between g-2">
            <h1>Reports</h1>
            <ButtonSpinner class="dark" :loading="pending" @click="refresh()">
                <i class="fa-solid fa-rotate"></i>
                <span>Refresh</span>
            </ButtonSpinner>
        </header>
        <template v-if="reports">
            <ReportQueue class="mt-2" :reports="reports" :topics="topicScope" @refresh="refresh()" />
        </template>
    </article>
</template>
