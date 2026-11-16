<script setup lang="ts">
import type { UserContentFilterView } from "@@/shared/types"

const hints = useHints()
const events = useEvents()
const session = getSession()
const userSettings = useUserSettings()
const filters = ref<UserContentFilterView>({
    mutedUsers: [],
    blockedUsers: [],
    mutedTopics: [],
    blockedTopics: [],
})
const filtersLoading = ref(false)
const filterAction = ref<string | null>(null)

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
    await refreshFilters()
}
catch (error: any) {
    hints.addError("Failed to load preferences.", error)
}

async function refreshFilters() {
    filtersLoading.value = true
    try {
        filters.value = await useApi<UserContentFilterView>("/api/profile/filters")
    }
    finally {
        filtersLoading.value = false
    }
}

async function removeFilter(action: "unmute" | "unblock", target: string) {
    filterAction.value = `${action}:${target}`
    try {
        await useApi(`/api/profile/filters/${action}`, {
            method: "POST",
            body: { target },
        })
        await Promise.all([refreshFilters(), userSettings.refresh()])
        hints.addSuccess(action === "unmute" ? "Mute removed." : "Block removed.")
    }
    catch (error: any) {
        hints.addError(action === "unmute" ? "Failed to remove mute." : "Failed to remove block.", error)
    }
    finally {
        filterAction.value = null
    }
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
        <section class="box column g-3 p-5">
            <h2>Muted users</h2>
            <p v-if="filtersLoading">Loading muted users...</p>
            <p v-else-if="filters.mutedUsers.length === 0" class="light">No users muted.</p>
            <div v-for="target in filters.mutedUsers" :key="target.id" class="row inline between g-2">
                <NuxtLink :to="`/user/${extractId(target.id)}`">{{ target.name }}</NuxtLink>
                <ButtonSpinner class="small" :loading="filterAction === `unmute:${target.id}`" :disabled="filterAction !== null" @click="removeFilter('unmute', target.id)">
                    Unmute
                </ButtonSpinner>
            </div>

            <!-- TODO the mutes and blocks should have its own page for the user profile -->
            <h2>Muted topics</h2>
            <p v-if="filtersLoading">Loading muted topics...</p>
            <p v-else-if="filters.mutedTopics.length === 0" class="light">No topics muted.</p>
            <div v-for="target in filters.mutedTopics" :key="target.id" class="row inline between g-2">
                <NuxtLink :to="`/topic/${extractId(target.id)}`">{{ target.name }}</NuxtLink>
                <ButtonSpinner class="small" :loading="filterAction === `unmute:${target.id}`" :disabled="filterAction !== null" @click="removeFilter('unmute', target.id)">
                    Unmute
                </ButtonSpinner>
            </div>

            <h2>Blocked users</h2>
            <p v-if="filtersLoading">Loading blocked users...</p>
            <p v-else-if="filters.blockedUsers.length === 0" class="light">No users blocked.</p>
            <div v-for="target in filters.blockedUsers" :key="target.id" class="row inline between g-2">
                <NuxtLink :to="`/user/${extractId(target.id)}`">{{ target.name }}</NuxtLink>
                <ButtonSpinner class="small" :loading="filterAction === `unblock:${target.id}`" :disabled="filterAction !== null" @click="removeFilter('unblock', target.id)">
                    Unblock
                </ButtonSpinner>
            </div>

            <h2>Blocked topics</h2>
            <p v-if="filtersLoading">Loading blocked topics...</p>
            <p v-else-if="filters.blockedTopics.length === 0" class="light">No topics blocked.</p>
            <div v-for="target in filters.blockedTopics" :key="target.id" class="row inline between g-2">
                <NuxtLink :to="`/topic/${extractId(target.id)}`">{{ target.name }}</NuxtLink>
                <ButtonSpinner class="small" :loading="filterAction === `unblock:${target.id}`" :disabled="filterAction !== null" @click="removeFilter('unblock', target.id)">
                    Unblock
                </ButtonSpinner>
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