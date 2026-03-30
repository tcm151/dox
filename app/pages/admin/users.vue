<script setup lang="ts">
import RoleManager from "./components/RoleManager.vue"
import type { Role, User } from '@@/shared/types'

const { data: users, refresh } = await useDatasource<User[]>("/api/user")

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
    <article class="column g-2 p-4">
        <header class="row g-2">
            <button class="link" @click="refresh()">
                <i class="fa-solid fa-rotate"></i>
                <span>Refresh</span>
            </button>
            <button class="f-1" :class="{ selected: filter == 'admin' }" @click="filterRole('admin')">
                <i class="fa-solid fa-shield"></i>
                <span>Admins</span>
            </button>
            <button class="f-1" :class="{ selected: filter == 'moderator' }" @click="filterRole('moderator')">
                <i class="fa-solid fa-clipboard"></i>
                <span>Moderators</span>
            </button>
            <button class="f-1" :class="{ selected: filter == 'developer' }" @click="filterRole('developer')">
                <i class="fa-solid fa-code"></i>
                <span>Developers</span>
            </button>
        </header>
        <section class="box column g-2 p-3">
            <div class="row g-1" v-for="user in filteredUsers">
                <Votes :target="user" />
                <!-- <Tag class="f-1 b-0" type="link" :label="user.roles.toString()" /> -->
                <UserTag class="f-1 b-0" :user="user" />
                <DurationTag width="6rem" :time="user.dateJoined" />
                <Tag type="link" icon="fa-ellipsis" @click="toggleRoleManager(user)" />
            </div>
        </section>
        <RoleManager v-if="showRoleManager && currentUser" :user="currentUser" @close="toggleRoleManager" />
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width(60rem, 1rem);
}
</style>