<script setup lang="ts">
import type { Report, Voteable } from '@@/shared/types'

const { data: reports } = await useDatasource<Report[]>("/api/report")

function viewSubject(report: Report) {
    navigateTo(`/${(report.subject as Voteable).id.replace(':', '/')}`)
}
</script>
    
<template>
    <article class="p-4">
        <section v-if="reports!.length > 0"class="box column g-2 p-3">
            <div class="row g-2" v-for="report in reports">
                <Tag class="f-1" type="danger" text="left" icon="fa-flag" :label="(report.subject as Voteable).id" @click="viewSubject(report)" />
                <UserTag width="12rem" :user="report.reporter" />
                <DurationTag width="4rem" :time="report.time" />
                <Tag type="link" icon="fa-trash-can" title="Dismiss" />
            </div>
        </section>
        <section v-else class="box p-3 text center">
            <p>There are currently no reports.</p>
        </section>
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width(60rem, 1rem);
}

</style>