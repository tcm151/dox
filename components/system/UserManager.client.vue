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
    session: string
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
        session: token,
    })
    
})

events.subscribe(Trigger.userLoggedOut, ({ user, clear }: { user: User, clear: boolean }) => {
    if (clear) {
        accounts.value = accounts.value.filter(u => u.id != user.id)
    }
})

const waiting = ref<string>("")
async function useLogin(profile: Profile) {
    try {
        waiting.value = profile.id
        await session.authenticate(profile.session)
        events.publish(Trigger.toggleUserManager)
        hints.addSuccess(`Logged into profile: ${session.user.name}`)
    }
    catch (ex: any) {
        events.publish(Trigger.toggleUserManager)
        events.publish(Trigger.toggleLogin, profile.name)
    }
    finally {
        waiting.value = ""
    }
}

function removeLogin(profile: Profile) {
    accounts.value = accounts.value.filter(a => a.id != profile.id)
}

function newLogin() {
    events.publish(Trigger.toggleUserManager)
    events.publish(Trigger.toggleLogin)
}

</script>

<template>
    <Window
        width="20rem"
        :visible="visible"
        title="Profiles"
    >
        <main class="column g-2">
            <div class="row g-2" v-for="user in otherAccounts">
                <ButtonSpinner class="info f-1" :loading="waiting == user.id" @click="useLogin(user)">
                    <span>{{ user.name }}</span>
                </ButtonSpinner>
                <button class="link" @click="removeLogin(user)">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
            <button class="link" @click="newLogin">
                <i class="fa-solid fa-plus"></i>
                <span>New Login</span>
            </button>
        </main>
    </Window>
</template>

<style scoped lang="scss">
</style>