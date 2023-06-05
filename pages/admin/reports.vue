<script setup lang="ts">
const { data: reports } = useAsyncData('reports', () => {
    return $fetch("/api/report")
})
</script>
    
<template>
    <article class="column g-4 p-4">
        <div class="report p-3" v-for="report in reports">
            <p><b>{{ report.reporter }}</b> reported: <b>{{ report.subject }}</b></p>
        </div>
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width(800px, 1rem);
}

div.report {
    text-align: center;
    border-radius: 0.25rem;
    background-color: $dox-white-ultra;
}
</style>