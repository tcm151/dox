<template>
    <div class="level level-left is-mobile mb-2">
        <p class="level-item box button has-text-weight-semibold" @click="$emit('sort', 'hot')">Hot</p>
        <p class="level-item box button has-text-weight-semibold" @click="$emit('sort', 'top')">Top</p>
        <p class="level-item box button has-text-weight-semibold" @click="$emit('sort', 'new')">New</p>
    </div>
</template>

<script setup lang="ts">

defineEmits(['sort'])

</script>