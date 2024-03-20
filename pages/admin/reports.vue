<script setup lang="ts">
import type { User, Report, Voteable } from '~/types';

const { data: reports } = useAsyncData('reports', () => {
    return $fetch<Report[]>("/api/report")
})
</script>
    
<template>
    <article class="p-4">
        <section class="box column g-2 p-3">
            <div class="row g-2" v-for="report in reports">
                <UserTag :fill="2" :user="(report.reporter as User)" />
                <TimeTag :fill="2" :time="report.time" />
                <Tag
                    :fill="10"
                    type="danger"
                    icon="fa-flag"
                    :label="(report.subject as Voteable).id"
                    @click="navigateTo(`/${(report.subject as Voteable).id.replace(':', '/')}`)"
                    />
            </div>
        </section>
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width(60rem, 1rem);
}
</style>