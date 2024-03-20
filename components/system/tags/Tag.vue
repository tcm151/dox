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
span.tag.default {
    background-color: $white-2;
    transition: color 256ms, background-color 256ms;
    font-weight: 800;
}

span.tag.default:hover {
    color: $white-0;
    background-color: $white-3;
}
</style>