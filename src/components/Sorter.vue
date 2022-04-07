<template>
    <div class="navbar box p-1 is-flex is-flex-direction-row">
        <div class="navbar-brand">
            <p class="navbar-item px-4" @click="$emit('sort', 'hot')">Hot</p>
            <p class="navbar-item px-4" @click="$emit('sort', 'top')">Top</p>
            <p class="navbar-item px-4" @click="$emit('sort', 'new')">New</p>
        </div>
    </div>
</template>

<script setup lang="ts">

defineEmits([
    'sort'
])

</script>