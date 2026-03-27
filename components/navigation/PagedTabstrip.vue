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
    <nav class="row tabstrip wide medium">
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