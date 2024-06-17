<script setup lang="ts">
import type { User } from '~/types';

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
    return accounts.value.filter(u => u.id != session.user.id)
})

events.subscribe(Trigger.authenticatedUser, ({ user, token }: { user: User, token: string }): void => {
    accounts.value = accounts.value.filter(u => u.id !== user.id)
    accounts.value.unshift({
        id: user.id,
        name: user.name,
        token: token,
    })
})

events.subscribe(Trigger.userLoggedOut, (user: User) => {
    accounts.value = accounts.value.filter(u => u.id !== user.id)
})

async function switchProfile(token: string) {
    if (await session.authenticate(token))
    {
        hints.addSuccess("Logged into new profile.")
        events.publish(Trigger.toggleUserManager)
    }
}


</script>

<template>
    <Window
        width="20rem"
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
        </main>
    </Window>
</template>

<style scoped lang="scss">
</style>