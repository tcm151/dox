<script setup lang="ts">
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
            <header class="profile" v-if="session.isAuthenticated && session.user">
                <section class="row g-2 p-5">
                    <figure class="image is-96x96">
                        <img src="https://bulma.io/images/placeholders/96x96.png">
                    </figure>
                    <div class="column fill">
                        <div class="name-follow">
                            <h1>{{ session.user?.name }}</h1>
                        </div>
                        <div class="follows row g-2">
                            <button class="link">
                                <span><strong>{{ session.user.topics.length }}</strong> topics</span>
                            </button>
                            <button class="info">
                                <span><strong>{{ session.user.followers.length }}</strong> followers</span>
                            </button>
                            <button class="info">
                                <span><strong>{{ session.user.following.length }}</strong> following</span>
                            </button>
                            <button class="info">
                                <span>joined <strong>{{ formatDate(session.user.dateCreated) }}</strong></span>
                            </button>
                        </div>
                    </div>
                </section>
            </header>
            <div class="not-logged-in p-4" v-else>
                <span>You are not logged in.</span>
            </div>
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
    @include fit-width(800px, 1rem);
}

.not-logged-in {
    @include fit-width(800px, 1rem);
    padding: 0.5rem 1rem;
    text-align: center;
    font-weight: 700;
    border-radius: 0.25rem;
    color: $dox-white-ultra;
    background-color: $dox-red;
}

.profile {
    border-radius: 0.25rem;
    background-color: $dox-white-ultra;

    .row {
        align-items: stretch;   
    }
}

.name-follow {
    flex: 1 1;
    @include flex-h;
    justify-content: space-between;
    align-items: center;

    h1 {
        font-size: 1.5rem;
    }

    span {
        padding: 0.25rem 1rem;
        font-weight: 700;
        border-radius: 0.25rem;
    }
}

.image {
    img {
        border-radius: 0.25rem;
    }
}

.follows {
    white-space: nowrap;
    text-align: center;

    > *:not(.votes) {
        flex: 1 1;
    }

    strong {
        font-weight: 800;
    }

    .info, .link {
        font-weight: 500;
        padding: 0.25rem 1rem;
        border-radius: 0.25rem;
    }
}

section.buttons {
    > * {
        flex: 1 1;
    }
}
</style>