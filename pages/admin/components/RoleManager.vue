<script setup lang="ts">
import type { User } from '~/types'

const hints = useHints()
const session = getSession()

const props = defineProps<{
    visible: boolean
    user: User | undefined
}>()

async function toggleAdmin() {
    if (!hasRole(props.user!, "admin")) {
        await session.useApi<User>("/api/admin/role/add", {
            user: props.user?.id,
            role: "admin"
        })
        hints.addSuccess("User given admin role.")
    }
    else {
        await session.useApi<User>("/api/admin/role/remove", {
            user: props.user?.id,
            role: "admin"
        })
        hints.addWarning("User removed from admin role.")
    }
}

</script>

<template>
    <Window
        width="25rem"
        :visible="visible"
        title="Role Manager"
    >
        <main class="column g-2">
            <button class="danger f-1">
                <i class="fa-solid fa-ban"></i>
                <span>Ban User</span>
            </button>
            <button class="default f-1" @click="toggleAdmin">
                <i class="fa-solid fa-shield"></i>
                <span>Make Admin</span>
            </button>
            <button class="default f-1">
                <i class="fa-solid fa-code"></i>
                <span>Make Developer</span>
            </button>
            <button class="default f-1">
                <i class="fa-solid fa-user-tie"></i>
                <span>Make Moderator</span>
            </button>
            <!-- <button v-if="!session.isAuthenticated" class="link" @click="newProfile">
                <i class="fa-solid fa-plus"></i>
                <span>New Profile</span>
            </button> -->
        </main>
    </Window>
</template>

<style scoped lang="scss">
</style>