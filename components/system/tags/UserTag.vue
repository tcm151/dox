<script setup lang="ts">
import type { User } from '~/types'

const props = defineProps<{
    user: User
}>()
</script>

<template>
    <Tag
        type="info"
        icon="fa-user"
        :label="user.name ?? 'deleted'"
        @click.stop="navigateTo(`/user/${extractId(user.id)}`)"
    />
</template>

<style scoped lang="scss">
</style>