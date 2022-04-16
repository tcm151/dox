<template>
    <div class="level level-left is-mobile">
        <p class="level-item button has-text-weight-semibold" @click="$emit('sort', 'hot')">Hot</p>
        <p class="level-item button has-text-weight-semibold" @click="$emit('sort', 'top')">Top</p>
        <p class="level-item button has-text-weight-semibold" @click="$emit('sort', 'new')">New</p>
    </div>
</template>

<script setup lang="ts">

defineEmits(['sort'])

</script>