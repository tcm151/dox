<script setup lang="ts">
import { computed, ref } from 'vue';
import { onBeforeRouteUpdate } from 'vue-router';
import { navigateTo, router } from '../../services/router';
import { store } from "../../services/store";
import Login from "../auth/Login.vue";

const session = computed(() => {
    return store.state.session;
})

//? does not do what intended
// onBeforeRouteUpdate(() => showMenu.value = false)

const showMenu = ref(false);
const showLogin = ref(false);

function toggleLogin() {
    showLogin.value = !showLogin.value;
}

function toggleMenu() {
    showMenu.value = !showMenu.value;
}

// function navigateTo(route: string) {
//     showMenu.value = false;
//     router.push(route);
// }

function logout() {
    store.commit("logout");
    // router.push("/");
    navigateTo("/")
}

</script>

<template>
    <Login :show-login="showLogin" @close-login="toggleLogin" />
    <nav class="navbar has-background-primary">
        <div class="navbar-brand">
            <router-link to="/" class="navbar-item my-auto is-size-3 has-text-weight-bold has-text-dark pr-2">
                <div class="icon-text">
                    <span class="icon is-medium">
                        <i class="fa-solid fa-box-archive"></i>
                    </span>
                    <span class="my-auto">DOX</span>
                </div>
            </router-link>
            <p class="navbar-item is-size-4 has-text-weight-semibold pl-0">For Everything</p>
            <div class="navbar-burger button m-3 ml-auto" v-bind:class="{ 'is-active': showMenu }"
                @click.prevent="toggleMenu">
                <span aria-hidden="true"></span>
                <span aria-hidden="true"></span>
                <span aria-hidden="true"></span>
            </div>
        </div>
        <div class="navbar-menu p-1" v-bind:class="{ 'is-active': showMenu }">
            <div class="navbar-end" v-if="!session.authenticated">
                <a class="icon-text navbar-item is-size-5 has-text-weight-semibold" @click.prevent="navigateTo('/')">
                    <span class="icon">
                        <i class="fa-solid fa-house"></i>
                    </span>
                    <span>Home</span>
                </a>
                <a class="icon-text navbar-item is-size-5 has-text-weight-semibold" @click.prevent="toggleLogin">
                    <span class="icon">
                        <i class="fa-solid fa-right-to-bracket"></i>
                    </span>
                    <span>Login</span>
                </a>
            </div>
            <div class="navbar-end" v-else>
                <a class="icon-text p-2 navbar-item is-size-5 has-text-weight-semibold"
                    @click.prevent="navigateTo('/')">
                    <span class="icon">
                        <i class="fa-solid fa-house"></i>
                    </span>
                    <span>Home</span>
                </a>
                <a class="icon-text p-2 navbar-item is-size-5 has-text-weight-semibold"
                    @click.prevent="navigateTo('/editor')">
                    <span class="icon">
                        <i class="fa-solid fa-feather-pointed"></i>
                    </span>
                    <span>Post</span>
                </a>
                <a class="icon-text p-2 navbar-item is-size-5 has-text-weight-semibold"
                    @click.prevent="navigateTo(`/profile/${session.user?.username}`)">
                    <span class="icon">
                        <i class="fa-solid fa-user"></i>
                    </span>
                    <span>{{ session.user?.username }}</span>
                </a>
                <a class="icon-text p-2 navbar-item is-size-5 has-text-weight-semibold " @click.prevent="logout">
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

.navbar-burger:hover {
    background-color: whitesmoke;
}

.navbar-item {
    border-radius: 0.25em;
    color: $dox-black;
}
</style>