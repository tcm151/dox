<script setup lang="ts">
const hints = useHints()
const userSettings = useUserSettings()

const { data: account } = await useAuthenticatedDatasource<Account>("/api/profile/account")

async function savePreferences() {
    try {
        if (!await userSettings.save()) return
        hints.addSuccess("Preferences saved successfully.")
    }
    catch (error: any) {
        hints.addError("Failed to save preferences.", error)
    }
}

async function resetPreferences() {
    await userSettings.refresh()
}
</script>


<template>
    <article class="column g-4 p-4">
        <header class="row wrap inline between g-2">
            <h1>Preferences</h1>
            <div class="row wrap g-2">
                <ButtonSpinner class="success" :loading="userSettings.pending" :disabled="userSettings.pending" @click="savePreferences">
                    <i class="fa-solid fa-floppy-disk"></i>
                    <span>Save</span>
                </ButtonSpinner>
                <button class="dark" :disabled="userSettings.loading || userSettings.saving" @click="resetPreferences">
                    <i class="fa-solid fa-rotate"></i>
                    <span>Cancel</span>
                </button>
            </div>
        </header>
        <p v-if="userSettings.loadError" class="negative" role="alert">
            Failed to load preferences. Use Cancel to try again.
        </p>
        <section class="box column p-5">
            <div class="field row center py-2">
                <div class="column f-1">
                    <label>enable animations</label>
                    <span class="tip">Animate interactive elements when hovered.</span>
                </div>
                <Toggle v-model:enabled="userSettings.preferences.ui.hoverAnimations" :disabled="userSettings.pending" />
            </div>
            <div class="field row center">
                <div class="column f-1">
                    <label>hint duration</label>
                    <span class="tip">How long status hints remain visible (milliseconds).</span>
                </div>
                <input type="number" class="px-2 py-1" size="4" step="1000" v-model="userSettings.preferences.ui.hintDuration" :disabled="userSettings.pending">
            </div>
            <hr>
            <div class="field row center py-2">
                <div class="column f-1">
                    <label>in app notifications</label>
                    <span class="tip">Receive notifications in the app.</span>
                </div>
                <Toggle
                    v-model:enabled="userSettings.preferences.notifications.inApp"
                    :disabled="userSettings.pending"
                />
            </div>
            <div class="field row center py-2">
                <div class="column f-1">
                    <label>email notifications</label>
                    <span class="tip">Receive notifications by email.</span>
                </div>
                <Toggle
                    v-model:enabled="userSettings.preferences.notifications.email"
                    :disabled="userSettings.pending"
                />
            </div>
            <hr>
            <div class="field row center">
                <div class="column f-1">
                    <label>profile audience</label>
                    <span class="tip">Choose who can see your profile details, social information, and feed.</span>
                </div>
                <select class="px-2 py-1" v-model="userSettings.preferences.privacy.profile" :disabled="userSettings.pending">
                    <option value="public">Public</option>
                    <option value="members">Members</option>
                    <option value="private">Private</option>
                </select>
            </div>
        </section>
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width(40rem, 1rem);
}

section {
    input {
        max-width: 8rem;
    }
}

hr {
    margin-inline: 0;
}
</style>