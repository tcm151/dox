<script setup lang="ts">
import type { Report } from '@@/shared/types'

definePageMeta({
    middleware: () => {
        if (!ENV.isClient()) return

        const session = getSession()
        if (!session.isAuthenticated || (!hasRole(session.user, "moderator") && !hasRole(session.user, "admin"))) {
            return abortNavigation()
        }
    }
})

const route = useRoute()

const id = route.params.topic?.toString()
const { data: topic } = useNuxtData<Topic>(`topic:${id}`)
const { data: reports, refresh } = await useAuthenticatedDatasource<Report[]>(`/api/topic/${id}/reports`)
</script>
    
<template>
    <article class="content-width p-4">
        <template v-if="topic">
            <TopicPreview :topic="topic" />
        </template>
        <ReportQueue v-if="reports" class="mt-2" :reports="reports" :refresh="refresh" :topic="id" />
    </article>
</template>
