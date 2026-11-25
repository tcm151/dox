<script setup lang="ts">
const hints = useHints()
const userSettings = useUserSettings()

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
    <article class="content-width column g-4 p-4">
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
                <Toggle name="ui.hoverAnimations"
                    :disabled="userSettings.pending"
                    v-model:enabled="userSettings.preferences.ui.hoverAnimations"
                />
            </div>
            <div class="field row center">
                <div class="column f-1">
                    <label>hint duration</label>
                    <span class="tip">How long status hints remain visible (milliseconds).</span>
                </div>
                <input type="number" class="px-2 py-1" name="ui.hintDuration" size="4" step="1000" v-model="userSettings.preferences.ui.hintDuration" :disabled="userSettings.pending">
            </div>
            <hr>
            <div class="field row center py-2">
                <div class="column f-1">
                    <label>in app notifications</label>
                    <span class="tip">Receive notifications in the app.</span>
                </div>
                <Toggle name="notifications.inApp"
                    v-model:enabled="userSettings.preferences.notifications.inApp"
                    :disabled="userSettings.pending"
                />
            </div>
            <div class="field row center py-2">
                <div class="column f-1">
                    <label>email notifications</label>
                    <span class="tip">Receive notifications by email.</span>
                </div>
                <Toggle name="notifications.email"
                    v-model:enabled="userSettings.preferences.notifications.email"
                    :disabled="userSettings.pending"
                />
            </div>
        </section>
    </article>
</template>

<style scoped lang="scss">
section {
    input, select {
        box-sizing: border-box;
        max-width: 10rem;
        width: 100%;
    }
}

hr {
    margin-inline: 0;
}
</style>