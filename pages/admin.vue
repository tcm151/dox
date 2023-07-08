<script setup lang="ts">
definePageMeta({
    layout: 'simple',
    middleware: (to, from) => {
        if (process.client) {
            const session = getSession()
            if (to.path.startsWith("/admin") && (!session.isAuthenticated || !session.user.admin)) {
                return abortNavigation()
            }
            if (to.path === "/admin") {
                return navigateTo("/admin/query")
            }
        }
    }
})

const route = useRoute()

const tabs = [
    { route: "/admin/reports", icon: "fa-solid fa-flag", label: "Reports" },
    { route: "/admin/feedback", icon: "fa-solid fa-message", label: "Feedback" },
    { route: "/admin/images", icon: "fa-solid fa-image", label: "Images" },
    { route: "/admin/grid", icon: "fa-solid fa-table", label: "Grid" },
    { route: "/admin/query", icon: "fa-solid fa-terminal", label: "Database" },
    { route: "/admin/chromadb", icon: "fa-solid fa-database", label: "ChromaDB" },
    { route: "/admin/backups", icon: "fa-solid fa-warehouse", label: "Backups" },
]
</script>

<template>
    <nav class="row">
        <TransitionGroup name="tabs">
            <NuxtLink v-for="tab in tabs" :key="tab.route" :to="tab.route"
                      :class="{ selected: tab.route == route.fullPath }">
                <i :class="tab.icon"></i>
                <span>{{ tab.label }}</span>
            </NuxtLink>
        </TransitionGroup>
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
        min-height: 19px;
        padding: 0.5rem 0.75rem;
        font-weight: 700;
        font-size: 1.1rem;
        color: $dox-white;
    }

    a.selected {
        background-color: $dox-black-light;
    }

    a:hover {
        cursor: pointer;
        background-color: $dox-black-light;
    }

    @media only screen and (max-width: 1000px) {
        a:not(.selected) {
            span {
                display: none;
            }
        }
    }
}

.tabs-move, .tabs-enter-active, .tabs-leave-active {
    transition: all 128ms ease;
}

</style>