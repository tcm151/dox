<template>
    <form class="fields is-grouped">
        <input type="text" placeholder="search..." v-model="searchText" />
        <button type="submit" @click="$emit('search', searchText)">Search</button>
    </form>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const searchText = ref("");

defineEmits([
    "search"
])


</script>