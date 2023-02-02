<script setup>
defineProps(['error'])
</script>

<template>
    <p>{{ error.statusCode }}</p>
    <p>{{ error.message }}</p>
    <p></p>
</template>