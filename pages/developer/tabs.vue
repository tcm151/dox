<script setup lang="ts">
const currentTab = ref('first')
</script>

<template>
    <SlottedTabstrip
        style="height: 100%"
        :current-tab="currentTab"
        @switch-tabs="(newTab) => currentTab = newTab"
        :tabs="[
            { label: 'first', icon: 'fa-solid fa-1' },
            { label: 'second', icon: 'fa-solid fa-2' },
            { label: 'third', icon: 'fa-solid fa-3' },
        ]"
    >
        <template #first>
            <h1>First!</h1>
        </template>
        <template #second>
            <h1>Second!</h1>
        </template>
        <template #third>
            <h2>Third!</h2>
        </template>
    </SlottedTabstrip>
</template>

<style scoped lang="scss">
</style>