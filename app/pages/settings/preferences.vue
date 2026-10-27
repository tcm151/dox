<script setup lang="ts">
const hints = useHints()
const events = useEvents()
const session = getSession()
const userSettings = useUserSettings()

const { data: account } = await useDatasource<Account>("/api/profile/account")
try {
    await userSettings.refresh()
}
catch {
    hints.addError("Failed to load notification preference.")
}

async function savePreferences() {
    try {
        await userSettings.save()
        hints.addSuccess("Preferences saved successfully.")
    }
    catch {
        hints.addError("Failed to save preferences.")
    }
}

async function resetPreferences() {
    try {
        await userSettings.refresh()
    }
    catch {
        hints.addError("Failed to reload preferences.")
    }
}

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
            catch {
                hints.addError('Failed to sign out other sessions.')
            }
        },
    })
}
</script>


<template>
    <article class="column g-4 p-4">
        <section class="box form g-1 p-5">
            <div class="field row center py-2">
                <label class="f-1">enable animations</label>
                <Toggle v-model:enabled="userSettings.preferences.ui.hoverAnimations" />
            </div>
            <div class="field row center py-2">
                <label class="f-1">enable notifications</label>
                <Toggle
                    v-model:enabled="userSettings.preferences.notifications.inApp"
                    :disabled="userSettings.loading || !userSettings.loaded || userSettings.saving"
                />
            </div>
            <div class="field row center">
                <label class="f-1">hint duration (ms)</label>
                <input type="number" size="4" step="1000" v-model="userSettings.preferences.ui.hintDuration">
            </div>
            <div class="row g-2">
                <ButtonSpinner class="success f-2" :loading="userSettings.saving" :disabled="userSettings.loading || !userSettings.loaded" @click="savePreferences">
                    <i class="fa-solid fa-floppy-disk"></i>
                    <span>Save</span>
                </ButtonSpinner>
                <button class="f-1" :disabled="userSettings.loading || !userSettings.loaded || userSettings.saving" @click="resetPreferences">
                    <i class="fa-solid fa-rotate"></i>
                    <span>Reset</span>
                </button>
            </div>
        </section>
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

section.form {
    input {
        max-width: 8rem;
    }
}
</style>