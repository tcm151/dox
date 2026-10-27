<script setup lang="ts">
import type { Report } from '@@/shared/types'

const { data: reports, refresh } = await useDatasource<Report[]>("/api/report")
</script>
    
<template>
    <article class="content-width p-4">
        <ReportQueue v-if="reports" :reports="reports" :refresh="refresh" />
    </article>
</template>
