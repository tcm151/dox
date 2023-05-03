<script setup lang="ts">
definePageMeta({
    layout: 'simple',
    middleware: (to, from) => {
        const session = getSession()
        if (to.path === "/admin" && !session.isAuthenticated) {
            return navigateTo("/")
        }
        if (to.path === "/admin") {
            return navigateTo("/admin/query")
        }
    }
})
</script>

<template>
    <nav class="row">
        <NuxtLink to="/admin/backups">
            <i class="fa-solid fa-warehouse"></i>
            <span>Backups</span>
        </NuxtLink>
        <NuxtLink to="/admin/feedback">
            <i class="fa-solid fa-message"></i>
            <span>Feedback</span>
        </NuxtLink>
        <NuxtLink to="/admin/reports">
            <i class="fa-solid fa-flag"></i>
            <span>Reports</span>
        </NuxtLink>
        <NuxtLink to="/admin/query">
            <i class="fa-solid fa-terminal"></i>
            <span>Database</span>
        </NuxtLink>
        <NuxtLink to="/admin/folders">
            <i class="fa-solid fa-folder-open"></i>
            <span>Folders</span>
        </NuxtLink>
        <NuxtLink to="/admin/images">
            <i class="fa-solid fa-image"></i>
            <span>Images</span>
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
        padding: 0.5rem 0.75rem;
        font-weight: 700;
        font-size: 1.1rem;
        color: $dox-white;
    }

    a:hover {
        cursor: pointer;
        background-color: $dox-black-light;
    }
}
</style>