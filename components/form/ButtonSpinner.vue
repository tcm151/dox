<script setup lang="ts">
const props = defineProps<{ loading?: boolean }>()

const spinning = ref<Boolean>(false)

watch(() => props.loading, (loading) => {
    (!loading)
        ? setTimeout(() => spinning.value = false, 256)
        : spinning.value = true
})
</script>

<template>
    <button :disabled="loading">
        <Spinner v-if="spinning" />
        <slot v-else />
    </button>
</template>

<style scoped lang="scss">
button {
    transition: all 128ms;
}

i.fa-spinner {
    color: $red;
    animation: spin 1s linear infinite;
}
</style>