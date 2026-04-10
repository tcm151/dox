<script setup lang="ts">
const props = defineProps<{
    tabs: TabItem[]
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
                    :title="tab.label"
                >
                    <i :class="`fa-solid ${tab.icon}`"></i>
                    <span>{{ tab.label }}</span>
                </NuxtLink>
            </template>
        </TransitionGroup>
    </nav>
</template>