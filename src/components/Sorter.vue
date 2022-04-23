<template>
    <div class="level level-left is-mobile">
        <div class="level-item button has-text-weight-semibold" @click="$emit('sort', 'hot')">
            <div class="icon-text">
                <span class="icon">
                    <i class="fa-solid fa-fire"></i>
                </span>
                <span>Hot</span>
            </div>
        </div>
        <div class="level-item button has-text-weight-semibold" @click="$emit('sort', 'top')">
            <div class="icon-text">
                <span class="icon">
                    <i class="fa-solid fa-arrow-up"></i>
                </span>
                <span>Top</span>
            </div>
        </div>
        <div class="level-item button has-text-weight-semibold" @click="$emit('sort', 'new')">
            <div class="icon-text">
                <span class="icon">
                    <i class="fa-solid fa-egg"></i>
                </span>
                <span>New</span>
            </div>
        </div>
        <!-- <p class="level-item button has-text-weight-semibold" @click="$emit('sort', 'hot')">Hot</p>
        <p class="level-item button has-text-weight-semibold" @click="$emit('sort', 'top')">Top</p>
        <p class="level-item button has-text-weight-semibold" @click="$emit('sort', 'new')">New</p> -->
    </div>
</template>

<script setup lang="ts">

defineEmits(['sort'])

</script>