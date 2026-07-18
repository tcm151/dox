<script setup lang="ts">

const route = useRoute()
const events = useEvents()
const config = useSettings()
const session = getSession()

const { public: { site } } = useRuntimeConfig()

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
</script>

<template>
    <nav class="tabstrip row inline between">
        <section class="left row">
            <NuxtLink class="title" :class="{ selected: route.path.startsWith('/feed') }" to="/feed" title="Home">
                <i class="fa-solid fa-box-archive"></i>
                <span>{{ site.titleShort.toUpperCase() }}</span>
            </NuxtLink>
            <Authenticated>
                <NuxtLink v-if="hasRole(session.user, 'moderator')" :class="{ selected: route.path.startsWith('/moderator') }" to="/moderator" title="Moderator">
                    <i class="fa-solid fa-screwdriver-wrench"></i>
                    <span>Moderator</span>
                </NuxtLink>
                <NuxtLink v-if="hasRole(session.user, 'admin')" :class="{ selected: route.path.startsWith('/admin') }" to="/admin" title="Admin">
                    <i class="fa-solid fa-shield"></i>
                    <span>Admin</span>
                </NuxtLink>
                <NuxtLink v-if="hasRole(session.user, 'developer')" :class="{ selected: route.path.startsWith('/developer') }" to="/developer" title="Developer">
                    <i class="fa-solid fa-code"></i>
                    <span>Developer</span>
                </NuxtLink>
            </Authenticated>
            <NuxtLink v-if="config.app.media.tokens.enabled" to="/store" title="Store">
                <i class="fa-solid fa-coins"></i>
            </NuxtLink>
        </section>
        <Transition name="slide">
            <section v-if="session.isAuthenticated" class="right row authenticated">
                <button v-if="config.app.misc.feedback.enabled" title="Feedback" @click="events.publish(Trigger.toggleFeedback)">
                    <i class="fa-solid fa-keyboard"></i>
                </button>
                <NuxtLink :class="{ selected: route.path.startsWith('/editor') }" to="/editor" title="Submit">
                    <i class="fa-solid fa-feather"></i>
                    <span>Submit</span>
                </NuxtLink>
                <NuxtLink :class="{ selected: route.path.startsWith('/inbox') }" to="/inbox" title="Inbox">
                    <i class="fa-solid fa-inbox"></i>
                    <span>Inbox</span>
                </NuxtLink>
                <NuxtLink to="/profile" @contextmenu.prevent="toggleUserManager">
                    <i class="fa-solid fa-user"></i>
                    <span>{{ session.user?.name }}</span>
                </NuxtLink>
                <button title="Logout" @click="session.logout(true)" @contextmenu.prevent="session.logout(false)">
                    <i class="fa-solid fa-right-from-bracket"></i>
                </button>
            </section>
            <section class="right row anonymous" v-else>
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
    </nav>
</template>

<style scoped lang="scss">
section.left {
    a.title {
        @media (max-width: $bp-mobile-wide) {
            span { display: none; }
        }
    }

    a:not(.title), button {
        @media (max-width: $bp-desktop) {
            span { display: none; }
        }
    }
}

section.right {
    top: 1px;
    right: 0;
    position: absolute;

    @media (max-width: $bp-tablet) {
        span { display: none; }
    }
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