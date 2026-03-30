<script setup lang="ts">
import type { User } from '@@/shared/types'

const props = defineProps<{
    user: User
    label?: string
    disable?: boolean
}>()

const icon = computed(() => {
    return (hasRole(props.user, "admin"))
        ? "fa-user-shield"
        : "fa-user"
})

function viewUser(userId: string) {
    if (props.disable) return
    navigateTo(`/user/${extractId(userId)}`)
}
</script>

<template>
    <Tag
        type="info"
        icon="fa-user"
        :label="user.name ?? label ?? 'deleted'"
        @click.stop="viewUser(user.id)"
    />
</template>

<style scoped lang="scss">
</style>