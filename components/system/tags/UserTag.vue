<script setup lang="ts">
import type { User } from '~/types'

const props = defineProps<{
    user: User
}>()
</script>

<template>
    <Tag type="info" icon="fa-user" :label="user.name ?? 'deleted'" @click="navigateTo(`/user/${extractId(user.id)}`)" />
    <!-- <span class="tag info" @click="navigateTo(`/user/${extractId(user.id)}`)">
        <i class="fa-solid fa-user"></i>
        <span>{{ user.name ?? "deleted" }}</span>
    </span> -->
</template>

<style scoped lang="scss">
span.tag {
    flex: 1 1 1rem;
}
</style>