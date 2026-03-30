<script setup lang="ts">
const session = getSession()
</script>

<template>
    <slot v-if="session.isAuthenticated" />
</template>