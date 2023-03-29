<script setup lang="ts">
const events = useEvents();
const session = getSession();

async function login() {
    if (!(await session.authenticate())) {
        events.publish('toggleLogin')
    }
}
</script>

<template>
    <div class="nav">
        <div class="left">
            <NuxtLink class="dox" to="/home">
                <i class="fa-solid fa-box-archive"></i>
                <span>DOX</span>
            </NuxtLink>
        </div>
        <ClientOnly>
            <Transition name="slide">
                <div class="right authenticated" v-if="session.isAuthenticated">
                    <NuxtLink to="/notifications">
                        <i class="fa-solid fa-envelope"></i>
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
                    <a @click="session.logout(false)" @contextmenu.prevent="session.logout(true)">
                        <i class="fa-solid fa-right-from-bracket"></i>
                        <span>Logout</span>
                    </a>
                </div>
                <div class="right anonymous" v-else>
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
                </div>
            </Transition>
        </ClientOnly>
    </div>
</template>

<style scoped lang="scss">
.nav {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    min-height: 32px;
    color: $dox-white-light;
    background-color: $dox-black;
    // background-clip: text;
    // background: linear-gradient(45deg, $dox-blue, $dox-purple);

    .left {
        @include flex-h;
    }

    .right {
        @include flex-h;

        top: 0;
        right: 0;
        position: absolute;
    }

    a {
        padding: 0.5rem;

        i { margin-right: 0.33rem }
        span { font-weight: 700 }
    }

    a:hover {
        cursor: pointer;
        background-color: $dox-black-light;
    }
}

.slide-enter-active {
    animation: slide 256ms ease-out backwards 128ms;
}

.slide-leave-active {
    animation: slide 128ms ease-in reverse;
}

@keyframes slide {
    from {
        transform: translate(100%, 0);
    }
    to {
        transform: translate(0, 0);
    }
}
</style>