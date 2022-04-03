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
import { computed, ref } from 'vue';
import { store } from '../services/store';
import PostList from '../components/PostList.vue';
import Sidebar from '../components/Sidebar.vue';

const session = computed(() => {
    return store.state.session;
})

</script>