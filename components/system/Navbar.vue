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
                <NuxtLink to="/admin" v-if="session.isAuthenticated && session.user.admin" title="Admin">
                    <i class="fa-solid fa-shield"></i>
                </NuxtLink>
                <NuxtLink to="/notifications" v-if="session.isAuthenticated" title="Notifications">
                    <i class="fa-solid fa-envelope"></i>
                </NuxtLink>
                <NuxtLink @click="showFeedback = true" v-if="session.isAuthenticated" title="Feedback">
                    <i class="fa-solid fa-message"></i>
                </NuxtLink>
                <Window title="Submit Feedback" :width="300" :visible="showFeedback" @close="showFeedback = false">
                    <Feedback placeholder="Tell us what you think..." @submit="showFeedback = false" />
                </Window>
            </ClientOnly>
        </section>
        <ClientOnly>
            <Transition name="slide">
                <section class="right authenticated" v-if="session.isAuthenticated">
                    <NuxtLink to="/chat">
                        <i class="fa-solid fa-comments"></i>
                        <span>Chat</span>
                    </NuxtLink>
                    <NuxtLink to="/feed">
                        <i class="fa-solid fa-signs-post"></i>
                        <span>Feed</span>
                    </NuxtLink>
                    <NuxtLink to="/editor">
                        <i class="fa-solid fa-feather-pointed"></i>
                        <span>Post</span>
                    </NuxtLink>
                    <NuxtLink to="/profile">
                        <i class="fa-solid fa-user"></i>
                        <span>{{ session.user?.name }}</span>
                    </NuxtLink>
                    <a @click="session.logout(true)" @contextmenu.prevent="session.logout(false)" title="Logout">
                        <i class="fa-solid fa-right-from-bracket"></i>
                    </a>
                </section>
                <section class="right anonymous" v-else>
                    <NuxtLink to="/feed">
                        <i class="fa-solid fa-signs-post"></i>
                        <span>Feed</span>
                    </NuxtLink>
                    <NuxtLink to="/feed">
                        <i class="fa-solid fa-signs-post"></i>
                        <span>Feed</span>
                    </NuxtLink>
                    <a @click="login">
                        <i class="fa-solid fa-right-from-bracket"></i>
                        <span>Login</span>
                    </a>
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
    color: $dox-white-light;
    background-color: $dox-black;
    // background-clip: text;
    // background: linear-gradient(45deg, $dox-blue, $dox-purple);
}

.left {
    @include flex-h;
}

section.right {
    @include flex-h;

    top: 0;
    right: 0;
    position: absolute;
}

a {
    cursor: pointer;
    padding: 0.75rem 0.75rem;
    font-weight: 700;
    font-size: 1.25rem;
    line-height: 1rem;
    transition: color 64ms, background-color 64ms;
}

a:hover {
    background-color: $dox-black-light;
}

.right {
    @media only screen and (max-width: 500px) {
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