<script setup lang="ts">
import type { Role, User } from '~/types'

const hints = useHints()

const props = defineProps<{
    user: User
}>()

async function toggleRole(role: Role) {
    try {
        if (!hasRole(props.user, role)) {
            props.user.roles.push(role)
            await useApi<User>("/api/admin/role/add", {
                body: {
                    user: props.user.id,
                    role: role
                }
            })
            hints.addSuccess(`User given ${role} role.`)
        }
        else {
            props.user.roles = props.user.roles.filter(r => r != role)
            await useApi<User>("/api/admin/role/remove", {
                body: {
                    user: props.user.id,
                    role: role
                }
            })
            hints.addSuccess(`User removed from ${role} role.`)
        }
    }
    catch (error: any) {
        hints.addError("Failed to update user with role.")
    }
}
</script>

<template>
    <Window title="Role Manager" width="20rem">
        <main class="column g-2">
            <button class="default f-1" :class="{ inverted: hasRole(user, 'admin') }" @click="toggleRole('admin')">
                <i class="fa-solid fa-shield"></i>
                <span>Admin</span>
            </button>
            <button class="default f-1" :class="{ inverted: hasRole(user, 'moderator') }" @click="toggleRole('moderator')">
                <i class="fa-solid fa-screwdriver-wrench"></i>
                <span>Moderator</span>
            </button>
            <button class="default f-1" :class="{ inverted: hasRole(user, 'developer') }" @click="toggleRole('developer')">
                <i class="fa-solid fa-code"></i>
                <span>Developer</span>
            </button>
        </main>
    </Window>
</template>

<style scoped lang="scss">
</style>