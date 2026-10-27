<script setup lang="ts">
const props = defineProps<{
    loading?: boolean
    disabled?: boolean
}>()

const spinning = ref<Boolean>(false)

watch(() => props.loading, (loading) => {
    (!loading)
        ? setTimeout(() => spinning.value = false, 200)
        : spinning.value = true
})
</script>

<template>
    <button :disabled="loading || disabled">
        <Spinner v-if="spinning" />
        <slot v-else />
    </button>
</template>

<style scoped lang="scss">
i.fa-spinner {
    color: $red;
    animation: spin var(--motion-duration-slow) linear infinite;
}
</style>