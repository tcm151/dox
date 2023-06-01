<script setup lang="ts">
const { data: reports } = useAsyncData('reports', () => {
    return $fetch("/api/report")
})
</script>
    
<template>
    {{ reports }}
</template>