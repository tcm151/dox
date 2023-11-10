<script setup lang="ts">
import type { User } from '~/types'

const props = defineProps<{
    user: User
}>()
</script>

<template>
    <span class="tag info" @click="navigateTo(`/user/${extractId(user.id)}`)">
        <i class="fa-solid fa-user"></i>
        <span>{{ user.name ?? "deleted" }}</span>
    </span>
</template>

<style scoped lang="scss">
</style>