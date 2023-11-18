
import type { emit } from 'process';

<script setup lang="ts">

const props = defineProps<{
    enabled: boolean
    label?: string
}>()

const emit = defineEmits<{
    (event: 'update:enabled'): void
}>()

</script>

<template>
    <div class="row g-2">
        <label class="toggle p-1">
            <input
                type="checkbox"
                :checked="enabled"
                @change="emit('update:enabled', $event.target.checked)"
            />
            <span class="slider" />
        </label>
        <span class="label">{{ label }}</span>
    </div>
</template>

<style scoped lang="scss">

div.row {
    align-items: center;
}

label.toggle {
    display: inline-block;
    position: relative;
    width: 2rem;
    height: 1rem;
    border-radius: 0.75rem;
    background-color: $dox-white-2;
    cursor: pointer;
    
    input {
        margin: 0;
        display: none;
    }
    
    span.slider {
        right: 50%;
        position: absolute;
        width: 1rem;
        height: 1rem;
        border-radius: 0.5rem;
        background-color: $dox-white-0;
        transition: all 256ms;
    }

    input:checked + span.slider {
        background-color: $dox-green-light;
        transform: translateX(100%);
    }

}

label.toggle:has(input:checked) {
    background-color: $dox-green;
    transition: all 256ms;
}

span.label {
    font-weight: 600;
}
</style>