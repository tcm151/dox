<script setup lang="ts">

const items = ref([
    { id: 0, value: 1234, user: "tcm" },
    { id: 1, value: 5678, user: "admin" },
    { id: 2, value: 9123, user: "engineering" },
    { id: 3, value: 4567, user: "marketing" },
])

</script>

<template>
    <article class="p-4">
        <DataGrid
            height="100%"
            title="Example Grid"
            :pagination="{
                pageSize: 25
            }"
            :tools="['refresh', 'add', 'edit', 'delete', 'save']"
            :items="items"
            :columns="[
                { field: 'id', label: 'ID' },
                { field: 'value', label: 'Value' },
                { field: 'user', label: 'User' },
            ]"
        />
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width(60rem, 1rem);
}
</style>