<script setup lang="ts">
const hints = useHints()
const events = useEvents()
const session = getSession()
const userSettings = useUserSettings()

async function sendConfirmation() {
    await useApi("/api/profile/confirm/send")
    hints.addSuccess("Confirmation sent! Expires in 15 minutes...")
}

async function resetPassword() {
    events.publish(Trigger.showPopup, {
        title: 'Confirm Password Reset',
        message: 'Are you sure you want to reset your password?',
        accept: async () => {
            await useApi(`/api/profile/password/reset`, {
                body: {
                    id: account.value?.email
                }
            })
            hints.addSuccess("Password reset link sent to your email.")
        },
    })
}

async function invalidateSessions() {
    events.publish(Trigger.showPopup, {
        title: 'Sign Out Everywhere?',
        message: 'This will sign you out of all other devices. This session will remain active.',
        accept: async () => {
            try {
                await useApi('/api/profile/sessions/invalidate')
                hints.addSuccess('All other sessions signed out successfully.')
            }
            catch (error: any) {
                hints.addError('Failed to sign out other sessions.', error)
            }
        },
    })
}
</script>


<template>
    <article class="column g-4 p-4">
        <section class="box column g-2 p-5">
            <button v-if="hasTrait(session.user, 'confirmed')" class="f-1 success">
                <i class="fa-solid fa-circle-check"></i>
                Account Confirmed
            </button>
            <button v-if="!hasTrait(session.user, 'confirmed')" class="f-1 danger" @click="sendConfirmation">
                <i class="fa-solid fa-circle-exclamation"></i>
                Confirm Account
            </button>
            <button class="link" @click="resetPassword">
                <i class="fa-solid fa-brain"></i>
                Forgot Password
            </button>
            <button class="danger" @click="invalidateSessions">
                <i class="fa-solid fa-sign-out-alt"></i>
                Sign Out Everywhere
            </button>
        </section>
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width(40rem, 1rem);
}
</style>