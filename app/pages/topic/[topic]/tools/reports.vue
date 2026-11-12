<script setup lang="ts">
import type { Report } from '@@/shared/types'

const route = useRoute()

const id = route.params.topic?.toString()
const topicScope = id ? [{ id: `topic:${id}` }] : []
const { data: topic } = useNuxtData<Topic>(`topic:${id}`)
const { data: reports, refresh } = await useAuthenticatedDatasource<Report[]>(`/api/topic/${id}/reports`)
</script>
    
<template>
    <article class="content-width p-4">
        <template v-if="topic">
            <TopicPreview :topic="topic" />
        </template>
        <template v-if="reports">
            <ReportQueue class="mt-2" :reports="reports" :topics="topicScope" @refresh="refresh()" />
        </template>
    </article>
</template>
