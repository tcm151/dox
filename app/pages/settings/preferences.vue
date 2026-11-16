<script setup lang="ts">
const hints = useHints()
const events = useEvents()
const session = getSession()
const userSettings = useUserSettings()

const { data: account } = await useAuthenticatedDatasource<Account>("/api/profile/account")
try {
    await userSettings.refresh()
}
catch (error: any) {
    hints.addError("Failed to load preferences.", error)
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
                <button class="dark" :disabled="userSettings.pending" @click="resetPreferences">
                    <i class="fa-solid fa-rotate"></i>
                    <span>Reset</span>
                </button>
            </div>
        </header>
        <section class="box column p-5">
            <div class="field row center py-2">
                <div class="column f-1">
                    <label>enable animations</label>
                    <span class="tip">Animate interactive elements when hovered.</span>
                </div>
                <Toggle v-model:enabled="userSettings.preferences.ui.hoverAnimations" />
            </div>
            <div class="field row center">
                <div class="column f-1">
                    <label>hint duration</label>
                    <span class="tip">How long status hints remain visible (milliseconds).</span>
                </div>
                <input type="number" size="4" step="1000" v-model="userSettings.preferences.ui.hintDuration">
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