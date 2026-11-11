<script setup lang="ts">
import { useAttrs } from "vue"

const props = defineProps<{
    width?: string
    type?: string
    icon?: string
    label?: string | number
    hidden?: boolean
}>()
const attrs = useAttrs()
</script>

<template>
    <component v-if="!hidden" :is="attrs.onClick ? 'button' : 'div'" :type="attrs.onClick ? 'button' : undefined" class="tag" :class="[type, { interactive: attrs.onClick }]" :style="{ width }">
        <i v-if="icon" class="fa-solid" :class="icon"></i>
        <span v-if="label !== undefined && label !== ''">{{ label }}</span>
        <slot />
    </component>
</template>

<style scoped lang="scss">
button.tag.interactive {
    padding: 0.25rem 0.5rem;
    font-size: 0.8rem;

    i {
        font-size: 0.8rem;
    }
}

.tag.default {
    background-color: $white-2;
    transition:
        color var(--motion-duration-quick) var(--motion-easing-standard),
        background-color var(--motion-duration-quick) var(--motion-easing-standard);
    font-weight: var(--fw-heavy);
}

.tag.default:hover {
    color: $white-0;
    background-color: $white-3;
}

.tag.inline {
    display: inline-block;
}

.tag.fw-normal {
    font-weight: var(--fw-normal);
}
</style>