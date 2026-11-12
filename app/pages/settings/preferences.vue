<script setup lang="ts">
const hints = useHints()
const events = useEvents()
const session = getSession()
const userSettings = useUserSettings()

function contentVisibilityMode(tag: string) {
    return userSettings.preferences.content.visibility[tag] ?? "inherit"
}

function updateContentVisibility(tag: string, event: Event) {
    const mode = (event.target as HTMLSelectElement).value
    const preferences = userSettings.preferences.content.visibility
    if (mode === "inherit") {
        delete preferences[tag]
    }
    else if (mode === "show" || mode === "mask" || mode === "filter") {
        preferences[tag] = mode
    }
    else {
        hints.addError("Invalid content visibility option.")
    }
}

const { data: account } = await useAuthenticatedDatasource<Account>("/api/profile/account")
try {
    await userSettings.refresh()
}
catch (error: any) {
    hints.addError("Failed to load notification preference.", error)
}

async function savePreferences() {
    try {
        await userSettings.save()
        hints.addSuccess("Preferences saved successfully.")
    }
    catch (error: any) {
        hints.addError("Failed to save preferences.", error)
    }
}

async function resetPreferences() {
    try {
        await userSettings.refresh()
    }
    catch (error: any) {
        hints.addError("Failed to reload preferences.", error)
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
            catch (error: any) {
                hints.addError('Failed to sign out other sessions.', error)
            }
        },
    })
}
</script>


<template>
    <article class="column g-4 p-4">
        <section class="box form g-1 p-5">
            <h2 class="mb-2">Content visibility</h2>
            <p class="tip mb-3">Choose how tagged content is displayed. Filtering removes it from feeds and search; direct links still require revealing it.</p>
            <div
                v-for="tag in [
                    { value: 'nsfw', label: 'NSFW' },
                    { value: 'spoiler', label: 'Spoiler' },
                ]"
                :key="tag.value"
                class="field row center py-2"
            >
                <label class="f-1">{{ tag.label }}</label>
                <select
                    :value="contentVisibilityMode(tag.value)"
                    :disabled="userSettings.loading || !userSettings.loaded || userSettings.saving"
                    @change="updateContentVisibility(tag.value, $event)"
                >
                    <option value="inherit">Use community default</option>
                    <option
                        v-for="mode in [
                            { value: 'show', label: 'Show normally' },
                            { value: 'mask', label: 'Mask and reveal' },
                            { value: 'filter', label: 'Filter from feeds and search' },
                        ]"
                        :key="mode.value"
                        :value="mode.value"
                    >
                        {{ mode.label }}
                    </option>
                </select>
            </div>
            <div class="field row center py-2">
                <label class="f-1">enable animations</label>
                <Toggle v-model:enabled="userSettings.preferences.ui.hoverAnimations" />
            </div>
            <div class="field row center py-2">
                <label class="f-1">in app notifications</label>
                <Toggle
                    v-model:enabled="userSettings.preferences.notifications.inApp"
                    :disabled="userSettings.loading || !userSettings.loaded || userSettings.saving"
                />
            </div>
            <div class="field row center py-2">
                <label class="f-1">email notifications</label>
                <Toggle
                    v-model:enabled="userSettings.preferences.notifications.email"
                    :disabled="userSettings.loading || !userSettings.loaded || userSettings.saving"
                />
            </div>
            <div class="field row center">
                <label class="f-1">hint duration (ms)</label>
                <input type="number" size="4" step="1000" v-model="userSettings.preferences.ui.hintDuration">
            </div>
            <div class="row g-2 mt-2">
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