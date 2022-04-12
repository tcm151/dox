<template>
    <Login :show-login="showLogin" @close-login="toggleLogin" />
    <nav class="navbar has-background-primary">
        <div class="navbar-brand">
            <router-link to="/" class="navbar-item my-auto is-size-2 has-text-weight-bold has-text-dark">DOX
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
                <a class="navbar-item is-size-5" @click.prevent="navigateTo('/')">Home</a>
                <a class="navbar-item is-size-5" @click.prevent="toggleLogin">Login</a>
                <a class="navbar-item is-size-5" @click.prevent="navigateTo('/register')">Register</a>
            </div>
            <div class="navbar-end" v-else>
                <a class="navbar-item is-size-5" @click.prevent="navigateTo('/')">Home</a>
                <a class="navbar-item is-size-5" @click.prevent="navigateTo('/profile')">Profile</a>
                <a class="navbar-item is-size-5" @click.prevent="navigateTo('/editor')">New Post</a>
                <a class="navbar-item is-size-5" @click.prevent="logout">Logout</a>
            </div>
        </div>
    </nav>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { router } from '../services/router';
import { store } from "../services/store";
import Login from "./Login.vue";

const session = computed(() => {
    return store.state.session;
})

onMounted(() => showMenu.value = false)

const showMenu = ref(false);
const showLogin = ref(false);

function toggleLogin() {
    showLogin.value = !showLogin.value;
}

function toggleMenu() {
    showMenu.value = !showMenu.value;
}

function navigateTo(route: string) {
    showMenu.value = false;
    router.push(route);
}

function logout() {
    store.commit("logout");
    router.push("/");
}

</script>