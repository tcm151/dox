<script setup lang="ts">
const config = useRuntimeConfig()
</script>

<template>
    <article class="content-width column g-2 p-4">
        <header class="row wrap inline between g-2">
            <h1>Info</h1>
        </header>
        <section class="box content column g-2 px-4">
            <table>
                <thead>
                    <tr>
                        <th scope="col">Property</th>
                        <th scope="col">Value</th>
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
table th:last-child, table td:last-child {
    text-align: right;
}
</style>