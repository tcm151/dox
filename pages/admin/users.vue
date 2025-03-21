<script setup lang="ts">
import RoleManager from "./components/RoleManager.vue"
import type { Role, User } from '~/types'

const { data: users, refresh } = await useFetch<User[]>("/api/user")

const filter = ref<Role | "">("")
const filteredUsers = computed(() => {
    switch (filter.value) {
        case "admin":
            return users.value?.filter(u => hasRole(u, "admin"))
        case "moderator":
            return users.value?.filter(u => hasRole(u, "moderator"))
        case "developer":
            return users.value?.filter(u => hasRole(u, "developer"))
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
    <article class="column g-2 p-4">
        <header class="row g-2">
            <button class="link f-1" @click="refresh()">
                <i class="fa-solid fa-rotate"></i>
                <span>Refresh</span>
            </button>
            <button class="default" :class="{ selected: filter == 'admin' }" @click="filterRole('admin')">
                <i class="fa-solid fa-shield"></i>
                <span>Admins</span>
            </button>
            <button class="default" :class="{ selected: filter == 'moderator' }" @click="filterRole('moderator')">
                <i class="fa-solid fa-clipboard"></i>
                <span>Moderators</span>
            </button>
            <button class="default" :class="{ selected: filter == 'developer' }" @click="filterRole('developer')">
                <i class="fa-solid fa-code"></i>
                <span>Developers</span>
            </button>
        </header>
        <section class="box column g-2 p-3">
            <div class="row g-1" v-for="user in filteredUsers">
                <Votes :target="user" />
                <!-- <Tag v-if="hasRole(user, 'admin')" type="link" icon="fa-shield" />
                <Tag v-if="hasRole(user, 'developer')" type="link" icon="fa-code" /> -->
                <UserTag class="f-1" :user="user" />
                <Tag type="info" icon="fa-stopwatch" :label="formatDate(user.dateJoined)" />
                <Tag type="info" icon="fa-ellipsis" @click="toggleRoleManager(user)" />
            </div>
        </section>
        <RoleManager
            :visible="showRoleManager"
            :user="currentUser"
            @close="toggleRoleManager"
        />
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width(60rem, 1rem);
}
</style>