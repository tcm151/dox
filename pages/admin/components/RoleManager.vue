<script setup lang="ts">
import type { Role, User } from '~/types'

const hints = useHints()

const props = defineProps<{
    visible: boolean
    user: User | undefined
}>()

async function toggleRole(role: Role) {
    if (!hasRole(props.user!, role)) {
        await useApi<User>("/api/admin/role/add", {
            body: {
                user: props.user?.id,
                role: role
            }
        })
        hints.addSuccess(`User given ${role} role.`)
    }
    else {
        await useApi<User>("/api/admin/role/remove", {
            body: {
                user: props.user?.id,
                role: role
            }
        })
        hints.addWarning(`User removed from ${role} role.`)
    }
}
</script>

<template>
    <Window
        width="20rem"
        :visible="visible"
        title="Role Manager"
    >
        <main class="column g-2">
            <button class="default f-1" :class="{ inverted: hasRole(user!, 'admin') }" @click="toggleRole('admin')">
                <i class="fa-solid fa-shield"></i>
                <span>Admin</span>
            </button>
            <button class="default f-1" :class="{ inverted: hasRole(user!, 'moderator') }" @click="toggleRole('moderator')">
                <i class="fa-solid fa-user-tie"></i>
                <span>Moderator</span>
            </button>
            <button class="default f-1" :class="{ inverted: hasRole(user!, 'developer') }" @click="toggleRole('developer')">
                <i class="fa-solid fa-code"></i>
                <span>Developer</span>
            </button>
        </main>
    </Window>
</template>

<style scoped lang="scss">
</style>