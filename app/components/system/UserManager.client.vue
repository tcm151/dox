<script setup lang="ts">
import type { Profile } from '@@/shared/types'

const hints = useHints()
const events = useEvents()
const session = getSession()

interface SavedProfile {
    id: string
    name: string
    token: string
}

const accounts = useLocalStorage<SavedProfile[]>("profiles", [])
const otherAccounts = computed(() => {
    return (session.isAuthenticated)
        ? accounts.value.filter(u => u.id != session.user.id)
        : accounts.value
})

events.subscribe(Trigger.authenticatedUser, (payload: { user: Profile, token: string }): void => {
    accounts.value = accounts.value.filter(u => u.id != payload.user.id)
    accounts.value.unshift({
        id: payload.user.id,
        name: payload.user.name,
        token: payload.token,
    })
})

events.subscribe(Trigger.userLoggedOut, ({ user, clear }: { user: Profile, clear: boolean }) => {
    if (clear) {
        accounts.value = accounts.value.filter(u => u.id != user.id)
    }
})

const waiting = ref<string>("")
async function useLogin(profile: SavedProfile) {
    try {
        waiting.value = profile.id
        await session.authenticate(profile.token)
        events.publish(Trigger.toggleUserManager)
        hints.addSuccess(`Logged into profile: ${session.user.name}`)
    }
    catch (error: any) {
        events.publish(Trigger.toggleUserManager)
        events.publish(Trigger.toggleLogin, profile.name)
    }
    finally {
        waiting.value = ""
    }
}

async function removeLogin(profile: SavedProfile) {
    try {
        await useApi("/api/profile/logout", {
            headers: {
                Authorization: profile.token
            },
            body: {
                clear: true
            }
        })
        hints.addSuccess(`Removed and invalidated session for ${profile.name}.`)
    }
    catch (error: any) {
        hints.addError("Unable to invalidate session.", error)
    }
    finally {
        accounts.value = accounts.value.filter(a => a.id != profile.id)
    }
}

function newLogin() {
    events.publish(Trigger.toggleUserManager)
    events.publish(Trigger.toggleLogin)
}

</script>

<template>
    <Window width="20rem" title="Profiles" icon="fa-solid fa-user">
        <main class="column g-2">
            <div class="row g-2" v-for="user in otherAccounts">
                <ButtonSpinner class="info f-1" :loading="waiting == user.id" @click="useLogin(user)">
                    <span>{{ user.name }}</span>
                </ButtonSpinner>
                <button class="link" @click="removeLogin(user)">
                    <i class="fa-solid fa-trash-can"></i>
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