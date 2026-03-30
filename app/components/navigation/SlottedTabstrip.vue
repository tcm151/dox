<script setup lang="ts">
const props = defineProps<{
    currentTab: string
    tabs: {
        label: string
        icon?: string
    }[]
}>()

const emit = defineEmits<{
    (event: 'switchTabs', tab: string): void
}>()

</script>

<template>
    <main class="column inline">
        <nav class="row tabstrip large">
            <TransitionGroup name="tabs">
                <button v-for="tab in tabs"
                    :class="{ selected: tab.label == currentTab }"
                    @click="emit('switchTabs', tab.label)"
                    :key="tab.label"
                >
                    <i v-if="tab.icon" :class="tab.icon"></i>
                    <span>{{ tab.label }}</span>
                </button>
            </TransitionGroup>
        </nav>
        <template v-for="(_, slot) in $slots" :name="slot">
            <slot :name="slot" v-if="currentTab == slot" />
        </template>
    </main>
</template>

<style scoped lang="scss">
main {
    width: 100%;
}
</style>