<script setup>
defineProps(['error'])
</script>

<template>
    <div class="error p-6">
        <div class="column g-2 p-5 mx-auto">
            <h1>{{ error.statusCode }}</h1>
            <p>{{ error.message }}</p>
            <button class="success" @click="clearError({ redirect: '/feed' })">Go Home</button>
        </div>
    </div>
</template>

<style scoped lang="scss">
.error {
    height: 100%;
    background-color: $dox-white-light;
    
    .column {
        align-items: center;
        border-radius: 0.25rem;
        background-color: $dox-white-ultra;
    }
}
</style>