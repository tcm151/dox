<script setup lang="ts">
import { navigateTo } from '../../services/router';

defineProps<{ label: string, class: string, route: string }>();

</script>


<template>
    <p class="tag" :class="class" @click="navigateTo(route)">{{ label }}</p>
</template>


<style scoped lang="scss">
@import '../../styles/global.scss';

.tag:hover {
    cursor: pointer;
    filter: brightness(0.95);
}
</style>