<script setup lang="ts">
// definePageMeta({
//     middleware: async (to, from) => {
//         const session = getSession()
//         if (session.isAuthenticated) {
//             return navigateTo(`/user/${extractId(session.user.id)}`)
//         }
//     }
// })

const session = getSession();
const settings = useUserSettings();

async function authenticate() {
    await session.useApi(`/api/profile/authenticate`)
}

async function verifyAccount() {
    await useFetch("/api/user/verify")
}

let showSettings = ref(false);
function toggleSettings() {
    showSettings.value = !showSettings.value;
}
</script>


<template>
    <ClientOnly>
        <article class="profile-page column g-2 p-4">
            <section class="buttons row g-2">
                <button @click="verifyAccount">Verify</button>
                <button @click="authenticate">Authenticate</button>
                <button @click="toggleSettings">Settings</button>
            </section>
            <!-- TODO add support for users to change their passwords -->
            <!-- TODO add two-factor authentication -->
            <Window :visible="showSettings" title="Settings" @close="toggleSettings">
                <div class="form">
                    <div class="field row-fit">
                        <label>hint duration (ms)</label>
                        <input type="number" size="4" step="250" v-model="settings.state.hintDuration">
                    </div>
                    <div class="row-fit g-2">
                        <input type="checkbox" v-model="settings.state.hoverAnimations">
                        <label>enable animations</label>
                    </div>
                    <div class="row-fit g-2">
                        <input type="checkbox" v-model="settings.state.showPreviewByDefault">
                        <label>show preview by default</label>
                    </div>
                </div>
            </Window>
        </article>
    </ClientOnly>
</template>

<style scoped lang="scss">
.profile-page {
    @include fit-width (800px, 1rem);
}

section.buttons {
    > * {
        flex: 1 1;
    }
}
</style>