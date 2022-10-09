<script setup lang="ts">
import { computed, ref } from 'vue';
import { onBeforeRouteUpdate } from 'vue-router';
import { navigateTo, router } from '../../services/router';
import { GetSession } from '../../services/store.new';
import Login from "../auth/Login.vue";
import Search from './Search.vue';

const session = GetSession();

const showMenu = ref(false);
const showLogin = ref(false);

function toggleLogin() {
    showLogin.value = !showLogin.value;
    showMenu.value = false;
}

function toggleMenu() {
    showMenu.value = !showMenu.value;
}

function logout() {
    session.logout();
    navigateTo("/")
}

function pressNavbar(action: Function) {
    showMenu.value = false;
    action?.();
}

</script>

<template>
    <Login :show-login="showLogin" @close-login="toggleLogin" />
    <nav class="navbar has-background-primary">
        <div class="navbar-brand">
            <div @click="pressNavbar(() => navigateTo('/'))" class="navbar-item">
                <div class="icon-text is-size-3 has-text-weight-bold pr-2">
                    <span class="icon is-medium">
                        <i class="fa-solid fa-box-archive"></i>
                    </span>
                    <span class="my-auto">DOX</span>
                </div>
            </div>
            <!-- <div class="navbar-item pl-0">
                <Search />
            </div> -->
            <div class="navbar-burger button m-3 ml-auto" v-bind:class="{ 'is-active': showMenu }"
                 @click.prevent="toggleMenu">
                <span aria-hidden="true"></span>
                <span aria-hidden="true"></span>
                <span aria-hidden="true"></span>
            </div>
        </div>
        <div class="navbar-menu py-1" v-bind:class="{ 'is-active': showMenu }">
            <div class="navbar-end" v-if="!session.isAuthenticated">
                <a class="navbar-item" @click.prevent="pressNavbar(() => navigateTo('/'))">
                    <span class="icon">
                        <i class="fa-solid fa-house"></i>
                    </span>
                    <span>Home</span>
                </a>
                <a class="navbar-item" @click.prevent="pressNavbar(toggleLogin)">
                    <span class="icon">
                        <i class="fa-solid fa-right-to-bracket"></i>
                    </span>
                    <span>Login</span>
                </a>
            </div>
            <div class="navbar-end" v-else>
                <a class="notifications navbar-item" @click.prevent="pressNavbar(() => navigateTo('/notifications'))">
                    <i class="fa-solid fa-envelope"></i>
                    <i v-if="session.get('unreadNotifications') > 0" class="fa-solid fa-circle unread-badge"></i>
                    <!-- <span class="unread-count">3</span> -->
                </a>
                <a class="navbar-item" @click.prevent="pressNavbar(() => navigateTo('/'))">
                    <span class="icon">
                        <i class="fa-solid fa-house"></i>
                    </span>
                    <span>Home</span>
                </a>
                <a class="navbar-item" @click.prevent="pressNavbar(() => navigateTo('/editor'))">
                    <span class="icon">
                        <i class="fa-solid fa-feather-pointed"></i>
                    </span>
                    <span>Post</span>
                </a>
                <a class="navbar-item"
                   @click.prevent="pressNavbar(() => navigateTo(`/profile/${session.User?.username}`))">
                    <span class="icon">
                        <i class="fa-solid fa-user"></i>
                    </span>
                    <span>{{ session.User?.username }}</span>
                </a>
                <a class="navbar-item" @click.prevent="pressNavbar(logout)">
                    <span class="icon">
                        <i class="fa-solid fa-right-from-bracket"></i>
                    </span>
                    <span>Logout</span>
                </a>
            </div>
        </div>
    </nav>
</template>

<style scoped lang="scss">
@import '../../styles/global.scss';

.navbar-burger {
    color: $dox-black;
    background-color: $dox-white;
}

.navbar-burger:hover {
    background-color: whitesmoke;
}

.navbar-brand {
    .navbar-item {
        cursor: pointer;
    }
}

.navbar-end {
    @include flex-h;

    .navbar-item {
        font-weight: 900;
        font-size: 1.25em;
        line-height: 1em;

        margin: 0.1em;
        padding: 0.1em 0.5em;

        .icon {
            margin-right: 0.2em;
        }
    }

    .navbar-item:hover {
        color: $primary;
        background-color: $primary-light;
    }
}

.navbar-item {
    color: $white;
    border-radius: 0.25em;
}


.notifications {
    i {
        font-size: 1.25em;
    }

    .unread-badge {

        top: 0.2em;
        right: 0.1em;
        position: absolute;

        font-size: 1em;
        color: $dox-purple;
    }

    .unread-count {
        top: 0.225em;
        right: 0.39em;
        position: absolute;

        font-size: 0.8em;
        color: $dox-black;
    }
}

.search-container {
    @include flex-h;
    padding: 2px;
}

@media only screen and (max-width: 600px) {
    .navbar-end {
        @include flex-v;

        .navbar-item {
            margin: 0;
            padding: 0.5em;
            color: $dox-black;
        }

        .navbar-item:hover {
            color: $primary;
            background-color: $primary-light;
        }
    }
}
</style>