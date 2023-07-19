<script setup lang="ts">
const props = defineProps<{
    currentTab: string
    tabs: {
        label: string
        icon: string
    }[]
}>()

const emit = defineEmits<{
    (event: 'switchTabs', tab: string): void
}>()

</script>

<template>
    <nav class="row">
        <TransitionGroup name="tabs">
            <button v-for="tab in tabs"
                :class="{ selected: tab.label == currentTab }"
                @click="emit('switchTabs', tab.label)"
                :key="tab.label"
            >
                <i :class="tab.icon"></i>
                <span>{{ tab.label }}</span>
            </button>
        </TransitionGroup>
    </nav>
</template>

<style scoped lang="scss">
nav.row {
    width: 100%;
    justify-content: center;
    border-top: 1px solid $dox-black-light;
    background-color: $dox-black;
    
    button {
        min-height: 19px;
        padding: 0.5rem 0.75rem;
        font-weight: 700;
        font-size: 1.1rem;
        color: $dox-white;
        border-radius: 0;
        background-color: $dox-black;
    }

    button.selected {
        background-color: $dox-black-light;
    }

    button:hover {
        cursor: pointer;
        background-color: $dox-black-light;
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