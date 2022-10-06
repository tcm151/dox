<script setup lang="ts">
import { ref } from 'vue'

const email = ref('')
</script>

<template>
    <input v-model="email" />
</template>
