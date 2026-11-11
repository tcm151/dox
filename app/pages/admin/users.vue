<script setup lang="ts">
import RoleManager from "./components/RoleManager.vue"
import type { Role, User } from '@@/shared/types'

const { data: users, pending, refresh } = await useDatasource<User[]>("/api/user")

const filter = ref<Role | "">("")
const filteredUsers = computed(() => {
    if (!users.value) {
        return []
    }
    switch (filter.value) {
        case "admin":
            return users.value.filter(u => hasRole(u, "admin"))
        case "moderator":
            return users.value.filter(u => hasRole(u, "moderator"))
        case "developer":
            return users.value.filter(u => hasRole(u, "developer"))
        default:
            return users.value
    }
})

function filterRole(role: Role) {
    filter.value = (filter.value == role) ? "" : role
}

const currentUser = ref<User | undefined>(undefined)
const showRoleManager = ref<boolean>(false)
function toggleRoleManager(user?: User) {
    currentUser.value = user
    showRoleManager.value = !showRoleManager.value
}
</script>
    
<template>
    <article class="content-width column g-2 p-4">
        <header class="row wrap inline between g-2">
            <h1>Users</h1>
            <ButtonSpinner class="dark" :loading="pending" @click="refresh()">
                <i class="fa-solid fa-rotate"></i>
                <span>Refresh</span>
            </ButtonSpinner>
        </header>
        <nav class="row wrap g-2" aria-label="Filter users by role">
            <button type="button" class="f-1 b-0" :class="{ selected: filter == 'admin' }" :aria-pressed="filter == 'admin'" @click="filterRole('admin')">
                <i class="fa-solid fa-shield"></i>
                <span>Admins</span>
            </button>
            <button type="button" class="f-1 b-0" :class="{ selected: filter == 'moderator' }" :aria-pressed="filter == 'moderator'" @click="filterRole('moderator')">
                <i class="fa-solid fa-clipboard"></i>
                <span>Moderators</span>
            </button>
            <button type="button" class="f-1 b-0" :class="{ selected: filter == 'developer' }" :aria-pressed="filter == 'developer'" @click="filterRole('developer')">
                <i class="fa-solid fa-code"></i>
                <span>Developers</span>
            </button>
        </nav>
        <section v-if="filteredUsers.length > 0" class="box column g-2 p-3" aria-label="User results">
            <template v-for="user in filteredUsers" :key="user.id">
                <article class="row wrap inline g-1" :aria-label="`User ${user.name}`">
                    <Votes :target="user" />
                    <!-- <Tag class="f-1 b-0" type="link" :label="user.roles.toString()" /> -->
                    <UserTag class="f-1 b-0" :user="user" />
                    <DurationTag width="6rem" :time="user.dateJoined" />
                    <Tag type="link" icon="fa-ellipsis" aria-label="Manage user roles" @click="toggleRoleManager(user)" />
                </article>
            </template>
        </section>
        <section v-else-if="users" class="box empty-state" aria-live="polite">
            <p>No users match the selected role.</p>
        </section>
        <OverlayTransition>
            <RoleManager v-if="showRoleManager && currentUser" :user="currentUser" @close="toggleRoleManager" />
        </OverlayTransition>
    </article>
</template>
