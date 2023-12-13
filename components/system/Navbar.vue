<script setup lang="ts">
const events = useEvents();
const session = getSession();

const showFeedback = ref(false)

async function login() {
    if (!(await session.authenticate())) {
        events.publish(Trigger.toggleLogin)
    }
}
</script>

<template>
    <nav>
        <section class="left">
            <NuxtLink class="dox" to="/home" title="Home">
                <i class="fa-solid fa-box-archive"></i>
                <span>DOX</span>
            </NuxtLink>
            <ClientOnly>
                <NuxtLink to="/feed">
                    <i class="fa-solid fa-signs-post"></i>
                    <span>Feeds</span>
                </NuxtLink>
                <NuxtLink to="/admin" v-if="session.isAuthenticated && session.user.admin" title="Admin">
                    <i class="fa-solid fa-shield"></i>
                    <span>Admin</span>
                </NuxtLink>
                <NuxtLink to="/developer" v-if="session.isAuthenticated && session.user.id == 'user:opkdyfig54tdre96jc37'" title="Developer">
                    <i class="fa-solid fa-code"></i>
                    <span>Developer</span>
                </NuxtLink>
                <NuxtLink to="/store" v-if="session.isAuthenticated" title="Store">
                    <i class="fa-solid fa-coins"></i>
                    <span>Store</span>
                </NuxtLink>
                <NuxtLink @click="showFeedback = true" v-if="session.isAuthenticated" title="Feedback">
                    <i class="fa-solid fa-keyboard"></i>
                </NuxtLink>
                <Window title="Submit Feedback" icon="fa-solid fa-keyboard" width="400px" :visible="showFeedback" @close="showFeedback = false">
                    <Feedback placeholder="Tell us what you think..." @submit="showFeedback = false" />
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
                    <NuxtLink to="/profile">
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
    @include flex-h;
    align-items: stretch;
    justify-content: space-between;
    color: $dox-white-1;
    background-color: $dox-black-0;
    // background-clip: text;
    // background: linear-gradient(45deg, $dox-blue, $dox-purple);
}

section.left {
    @include flex-h;

    a.dox {
        @media only screen and (max-width: 500px) {
            span { display: none; }
        }
    }

    a:not(.dox) {
        @media only screen and (max-width: 1000px) {
            span { display: none; }
        }
    }

    a[title=Developer] {
        @media only screen and (max-width: 600px) {
            display: none;
        }
    }
}

section.right {
    @include flex-h;

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
    background-color: $dox-black-1;
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