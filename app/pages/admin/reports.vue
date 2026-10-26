<script setup lang="ts">
import type { Report } from '@@/shared/types'

const { data: reports, refresh } = await useDatasource<Report[]>("/api/report")
</script>
    
<template>
    <article class="p-4">
        <ReportQueue v-if="reports" :reports="reports" :refresh="refresh" />
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width(60rem, 1rem);
}

</style>