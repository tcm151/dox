<script setup lang="ts">
definePageMeta({
    layout: 'simple',
    middleware: (to, from) => {
        if (to.path === "/admin") {
            return navigateTo("/admin/feedback")
        }
    }
})
</script>

<template>
    <nav class="row">
        <NuxtLink to="/admin/feedback">
            <i class="fa-solid fa-message"></i>
            <span>Feedback</span>
        </NuxtLink>
        <NuxtLink to="/admin/reports">
            <i class="fa-solid fa-flag"></i>
            <span>Reports</span>
        </NuxtLink>
    </nav>
    <NuxtPage />
</template>

<style scoped lang="scss">
nav.row {
    width: 100%;
    justify-content: center;
    border-top: 1px solid $dox-black-light;
    background-color: $dox-black;
    
    a {
        padding: 0.5rem 1rem;
        font-weight: 700;
        font-size: 1.2rem;
        color: $dox-white;
    }

    a:hover {
        cursor: pointer;
        background-color: $dox-black-light;
    }
}
</style>