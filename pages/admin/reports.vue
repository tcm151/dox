<script setup lang="ts">
import type { User, Report, Voteable } from '~/types'

const { data: reports } = await useFetch<Report[]>("/api/report")

function viewSubject(report: Report) {
    navigateTo(`/${(report.subject as Voteable).id.replace(':', '/')}`)
}
</script>
    
<template>
    <article class="p-4">
        <section class="box column g-2 p-3" v-if="reports!.length > 0">
            <div class="row g-2" v-for="report in reports">
                <UserTag width="6rem" :user="(report.reporter as User)" />
                <DurationTag width="4rem" :time="report.time" />
                <Tag class="f-1" type="danger" icon="fa-flag" :label="(report.subject as Voteable).id" @click="viewSubject(report)" />
            </div>
        </section>
        <section class="box p-3" v-else>
            <p>There are currently no reports...</p>
        </section>
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width(60rem, 1rem);
}

section.box {
    p {
        text-align: center;
    }
}
</style>