<script setup lang="ts">
definePageMeta({
    layout: 'simple',
    middleware: (to, from) => {
        if (to.path === "/feed") {
            return navigateTo("/feed/posts")
        }
    }
})

const route = useRoute()

const tabs = [
    { route: "/feed/posts", icon: "fa-solid fa-newspaper", label: "Posts" },
    { route: "/feed/images", icon: "fa-solid fa-image", label: "Images" },
    { route: "/feed/topics", icon: "fa-solid fa-tags", label: "Topics" },
]
</script>

<template>
    <article class="column center-inline">
        <nav class="row">
            <TransitionGroup name="tabs">
                <NuxtLink v-for="tab in tabs" :key="tab.route" :to="tab.route"
                          :class="{ selected: tab.route == route.fullPath }">
                    <i :class="tab.icon"></i>
                    <span>{{ tab.label }}</span>
                </NuxtLink>
            </TransitionGroup>
        </nav>
        <section class="page column center-inline">
            <NuxtPage />
        </section>
    </article>
</template>

<style scoped lang="scss">
article {
    width: 100%;
    overflow-y: hidden;
}

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

section.page {
    width: 100%;
    overflow-y: auto;
}

.tabs-move, .tabs-enter-active, .tabs-leave-active {
    transition: all 128ms ease;
}

</style>