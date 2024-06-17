<script setup lang="ts">
import type { User } from '~/types'

const hints = useHints()
const events = useEvents()
const session = getSession()

defineProps<{
    visible: boolean
}>()

interface Profile {
    id: string
    name: string
    token: string
}

const accounts = useLocalStorage<Profile[]>("profiles", [])
const otherAccounts = computed(() => {
    return (session.isAuthenticated)
        ? accounts.value.filter(u => u.id != session.user.id)
        : accounts.value
})

events.subscribe(Trigger.authenticatedUser, ({ user, token }: { user: User, token: string }): void => {
    accounts.value = accounts.value.filter(u => u.id != user.id)
    accounts.value.unshift({
        id: user.id,
        name: user.name,
        token: token,
    })
    
})

events.subscribe(Trigger.userLoggedOut, ({ user, clear }: { user: User, clear: boolean }) => {
    if (clear) {
        accounts.value = accounts.value.filter(u => u.id != user.id)
    }
})

async function switchProfile(token: string) {
    if (await session.authenticate(token))
    {
        hints.addSuccess(`Logged into profile: ${session.user.name}`)
        events.publish(Trigger.toggleUserManager)
    }
}

function newProfile() {
    events.publish(Trigger.toggleUserManager)
    events.publish(Trigger.toggleLogin)
}

</script>

<template>
    <Window
        width="25rem"
        :visible="visible"
        title="User Manager"
    >
        <main class="column g-2">
            <div class="row g-2" v-for="user in otherAccounts">
                <button class="info f-1">
                    <i class="fa-solid fa-user"></i>
                    <span>{{ user.name }}</span>
                </button>
                <button class="link" @click="switchProfile(user.token)">
                    <i class="fa-solid fa-right-from-bracket"></i>
                </button>
            </div>
            <button v-if="!session.isAuthenticated" class="link" @click="newProfile">
                <i class="fa-solid fa-plus"></i>
                <span>New Profile</span>
            </button>
        </main>
    </Window>
</template>

<style scoped lang="scss">
</style>