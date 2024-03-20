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
    <main class="column">
        <nav class="row">
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
    align-items: center;
}

nav.row {
    width: 100%;
    justify-content: center;
    border-top: 1px solid $black-1;
    background-color: $black-0;
    
    button {
        min-height: 19px;
        padding: 0.5rem 0.75rem;
        font-weight: 700;
        font-size: 1.1rem;
        color: $white-2;
        border-radius: 0;
        background-color: $black-0;
    }

    button.selected {
        background-color: $black-1;
    }

    button:hover {
        cursor: pointer;
        background-color: $black-1;
    }

    @media only screen and (max-width: 1000px) {
        button:not(.selected) {
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