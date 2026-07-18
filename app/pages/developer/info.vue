<script setup lang="ts">
const config = useRuntimeConfig()
</script>

<template>
    <article class="p-4">
        <section class="box content column g-2 px-4">
            <table>
                <thead>
                    <tr>
                        <th>Info</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Version</td>
                        <td>{{ config.public.version }}</td>
                    </tr>
                </tbody>
            </table>
        </section>
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width(40rem, 1rem);
}

table th:last-child, table td:last-child {
    text-align: right;
}
</style>