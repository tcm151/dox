feedbackVisible<script setup lang="ts">

const events = useEvents()
const session = getSession()
const config = useSettings()

const { public: { site } } = useRuntimeConfig()

const feedbackVisible = ref(false)
const accounts = useLocalStorage<any[]>("profiles", [])
async function login() {
    if (accounts.value.length > 0) {
        events.publish(Trigger.toggleUserManager)
    }
    else {
        events.publish(Trigger.toggleLogin)
    }
}

function toggleUserManager() {
    events.publish(Trigger.toggleUserManager)
}

const showAdmin = computed(() => session.isAuthenticated && hasRole(session.user, 'admin'))
const showDeveloper = computed(() => (session.isAuthenticated && hasRole(session.user, 'developer')) || ENV.isDevelopment())
const showStore = computed(() => session.isAuthenticated && config.app.navbar.showStore)
const showFeedback = computed(() => session.isAuthenticated && config.app.navbar.showFeedback)
</script>

<template>
    <nav class="navbar row">
        <section class="left row">
            <NuxtLink class="title" title="Home">
                <i class="fa-solid fa-box-archive"></i>
                <span>{{ site.titleShort.toUpperCase() }}</span>
            </NuxtLink>
            <ClientOnly>
                <NuxtLink to="/feed" title="Feed">
                    <i class="fa-solid fa-signs-post"></i>
                    <span>Feeds</span>
                </NuxtLink>
                <NuxtLink to="/admin" v-if="showAdmin" title="Admin">
                    <i class="fa-solid fa-shield"></i>
                    <span>Admin</span>
                </NuxtLink>
                <NuxtLink to="/developer" v-if="showDeveloper" title="Developer">
                    <i class="fa-solid fa-code"></i>
                    <span>Developer</span>
                </NuxtLink>
                <NuxtLink to="/store" v-if="showStore" title="Store">
                    <i class="fa-solid fa-coins"></i>
                </NuxtLink>
                <NuxtLink @click="feedbackVisible = true" v-if="showFeedback" title="Feedback">
                    <i class="fa-solid fa-keyboard"></i>
                </NuxtLink>
                <Window title="Submit Feedback" icon="fa-solid fa-keyboard" width="40rem" :visible="feedbackVisible" @close="feedbackVisible = false">
                    <Feedback placeholder="Tell us what you think..." @submit="feedbackVisible = false" />
                </Window>
            </ClientOnly>
        </section>
        <ClientOnly>
            <Transition name="slide">
                <section class="right authenticated" v-if="session.isAuthenticated">
                    <NuxtLink to="/editor">
                        <i class="fa-solid fa-feather-pointed"></i>
                        <span>Submit</span>
                    </NuxtLink>
                    <NuxtLink to="/inbox" v-if="session.isAuthenticated" title="Inbox">
                        <i class="fa-solid fa-inbox"></i>
                        <span>Inbox</span>
                    </NuxtLink>
                    <NuxtLink to="/profile" @contextmenu.prevent="toggleUserManager">
                        <i class="fa-solid fa-user"></i>
                        <span>{{ session.user?.name }}</span>
                    </NuxtLink>
                    <NuxtLink @click="session.logout(true)" @contextmenu.prevent="session.logout(false)" title="Logout">
                        <i class="fa-solid fa-right-from-bracket"></i>
                    </NuxtLink>
                </section>
                <section class="right anonymous" v-else>
                    <NuxtLink @click="login">
                        <i class="fa-solid fa-right-from-bracket"></i>
                        <span>Login</span>
                    </NuxtLink>
                    <NuxtLink to="/register">
                        <i class="fa-solid fa-user-plus"></i>
                        <span>Register</span>
                    </NuxtLink>
                </section>
            </Transition>
        </ClientOnly>
    </nav>
</template>

<style scoped lang="scss">
nav {
    align-items: stretch;
    justify-content: space-between;
    color: $white-1;
    background-color: $black-0;
}

section.left {
    a.title {
        @media only screen and (max-width: 500px) {
            span { display: none; }
        }
    }

    a:not(.title) {
        @media only screen and (max-width: 1000px) {
            span { display: none; }
        }
    }
}

section.right {
    top: 0;
    right: 0;
    position: absolute;

    @media only screen and (max-width: 600px) {
        span { display: none; }
    }
}

a {
    cursor: pointer;
    padding: 0.75rem 0.75rem;
    font-weight: 700;
    font-size: 1.25rem;
    line-height: 1rem;
    transition: color 64ms, background-color 64ms;

    @media screen and (max-width: 600px) {
        font-size: 1.5rem;
    }
}

a:hover {
    background-color: $black-1;
}

@keyframes slide {
    from { transform: translate(100%, 0) }
    to { transform: translate(0, 0) }
}

.slide-enter-active {
    animation: slide 256ms ease-out backwards 128ms;
}

.slide-leave-active {
    animation: slide 128ms ease-in reverse;
}
</style>