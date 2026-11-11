<script setup lang="ts">
import { onBeforeUnmount } from "vue"

const props = defineProps<{
    loading?: boolean
    disabled?: boolean
}>()

const spinning = ref(false)
let hideSpinnerTimeout: ReturnType<typeof setTimeout> | undefined

watch(() => props.loading, (loading, wasLoading) => {
    if (loading) {
        if (hideSpinnerTimeout) clearTimeout(hideSpinnerTimeout)
        spinning.value = true
    }
    else if (wasLoading) {
        hideSpinnerTimeout = setTimeout(() => {
            spinning.value = false
            hideSpinnerTimeout = undefined
        }, 200)
    }
}, { immediate: true })

onBeforeUnmount(() => {
    if (hideSpinnerTimeout) clearTimeout(hideSpinnerTimeout)
})
</script>

<template>
    <button :disabled="loading || disabled" :aria-busy="loading">
        <span class="button-spinner-state" :class="{ spinning }">
            <span class="button-spinner-content row inline g-1"><slot /></span>
            <span v-if="spinning" class="button-spinner-indicator" aria-hidden="true"><Spinner :showText="false" /></span>
        </span>
    </button>
</template>

<style scoped lang="scss">
.button-spinner-state {
    display: inline-grid;
    position: relative;
}

.button-spinner-content {
    grid-area: 1 / 1;
}

.button-spinner-indicator {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    pointer-events: none;
}

.button-spinner-state.spinning .button-spinner-content {
    opacity: 0;
}

i.fa-spinner {
    color: $red;
    animation: spin var(--motion-duration-slow) linear infinite;
}
</style>