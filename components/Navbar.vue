<script setup lang="ts">
const session = getSession();
const events = useEvents();

async function login() {
    if (!(await session.authenticate())) {
        events.publish('toggleLogin')
    } else {
        console.log("Logged in!")
    }
}

const hints = useHints();

function addHint() {
    hints.addSuccess("Hi, this is a hint :)");
}

</script>

<template>
    <div class="nav">
        <div class="left">
            <NuxtLink class="dox" to="/">
                <i class="fa-solid fa-box-archive"></i>
                <span>DOX</span>
            </NuxtLink>
        </div>
        <ClientOnly>
            <Transition name="slide">
                <div class="right authenticated" v-if="session.isAuthenticated">
                    <NuxtLink @click="addHint">
                        <i class="fa-solid fa-envelope"></i>
                    </NuxtLink>
                    <NuxtLink to="/">
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
                    <NuxtLink to="/">
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
@import "~/assets/global.scss";

// .dox {
//     i, span {
//         color: $dox-purple;
//     }
// }

.nav {
    display: flex;
    flex-direction: row;
    justify-content: space-between;

    color: $dox-white-light;
    background-color: $dox-black;

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