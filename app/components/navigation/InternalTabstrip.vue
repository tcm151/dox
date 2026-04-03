<script setup lang="ts">
const props = defineProps<{
    selected: string
    tabs: {
        label: string
        icon?: string
    }[]
}>()

const emit = defineEmits<{
    (event: 'switch', tab: string): void
}>()
</script>

<template>
    <nav class="row tabstrip small">
        <TransitionGroup name="tabs">
            <button v-for="tab in tabs"
                :class="{ selected: tab.label.toLowerCase() == selected.toLowerCase() }"
                @click="emit('switch', tab.label)"
                :key="tab.label"
            >
                <i v-if="tab.icon" :class="`fa solid ${tab.icon}`"></i>
                <span>{{ tab.label }}</span>
            </button>
        </TransitionGroup>
    </nav>
</template>