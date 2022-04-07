<template>
    <div class="columns p-4">
        <div class="column">
            <PostList />
        </div>
        <div class="column is-4">
            <Sidebar />
        </div>
    </div>
</template>

<script setup lang="ts">
import PostList from '../components/PostList.vue';
import Sidebar from '../components/Sidebar.vue';
</script>