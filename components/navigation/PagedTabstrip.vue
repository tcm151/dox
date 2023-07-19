<script setup lang="ts">
const props = defineProps<{
    tabs: {
        route: string
        label: string
        icon: string
    }[]
}>()

const route = useRoute()
</script>

<template>
    <nav class="row">
        <TransitionGroup name="tabs">
            <NuxtLink v-for="tab in tabs"
                :class="{ selected: tab.route == route.fullPath }"
                :key="tab.route"
                :to="tab.route"
            >
                <i :class="tab.icon"></i>
                <span>{{ tab.label }}</span>
            </NuxtLink>
        </TransitionGroup>
    </nav>
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