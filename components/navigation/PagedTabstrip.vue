<script setup lang="ts">
const props = defineProps<{
    tabs: {
        route: string
        label: string
        icon: string
        hide?: () => boolean
    }[]
}>()

const route = useRoute()
</script>

<template>
    <nav class="row">
        <TransitionGroup name="tabs">
            <template v-for="tab in tabs" :key="tab.route">
                <NuxtLink v-if="!tab.hide?.()"
                    :class="{ selected: tab.route == route.fullPath }"
                    :to="tab.route"
                >
                    <i :class="tab.icon"></i>
                    <span>{{ tab.label }}</span>
                </NuxtLink>
            </template>
        </TransitionGroup>
    </nav>
</template>

<style scoped lang="scss">
nav.row {
    width: 100%;
    justify-content: center;
    border-top: 1px solid $black-1;
    background-color: $black-0;

    a {
        min-height: 19px;
        padding: 0.5rem 1.5rem;
        font-weight: 700;
        font-size: 1.1rem;
        color: $white-2;
    }

    a.selected {
        background-color: $black-1;
    }

    a:hover {
        cursor: pointer;
        background-color: $black-1;
    }

    @media only screen and (max-width: 600px) {
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