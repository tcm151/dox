<script setup lang="ts">
const props = defineProps<{
    fill?: number
    type?: string
    icon?: string
    label?: string | number
    hidden?: boolean
}>()
</script>

<template>
    <span v-if="!hidden" class="tag" :class="type" :style="{ flex: fill ?? 0 }">
        <i v-if="icon" class="fa-solid" :class="icon"></i>
        <span v-if="label">{{ label }}</span>
        <slot />
    </span>
</template>

<style scoped lang="scss">
</style>