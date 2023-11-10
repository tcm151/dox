<script setup lang="ts">
const props = defineProps<{
    type?: string
    icon?: string
    label?: string | number
    hidden?: boolean
}>()
</script>

<template>
    <span class="tag" :class="type" v-if="!hidden">
        <i v-if="icon" class="fa-solid" :class="icon"></i>
        <span v-if="label">{{ label }}</span>
    </span>
</template>

<style scoped lang="scss">
</style>