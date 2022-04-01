<template>
    <nav class="navbar has-background-primary">
        <div class="navbar-brand">
            <router-link class="navbar-item my-auto is-size-2 has-text-weight-bold has-text-dark" to="/">DOX</router-link>
            <p class="navbar-item is-size-4 has-text-weight-semibold pl-0">For Everything</p>
        </div>
        <div class="navbar-menu is-active">
            <div class="navbar-end">
                <div class="navbar-item field is-grouped" v-if="!session.authenticated">
                    <input
                        class="input"
                        type="username"
                        placeholder="username"
                        v-model="username"
                        required
                    />
                    <input
                        class="input ml-2 mr-1"
                        type="password"
                        placeholder="password"
                        v-model="password"
                        required
                    />
                    <button class="button ml-1 mr-2" @click.prevent="login">Login</button>
                    <router-link class="navbar-item button" to="/register">Register</router-link>
                </div>
                <div class="navbar-item" v-else>
                    <button class="button has-text-weight-bold has-background-primary-light">{{ session.user?.username }}</button>
                    <button class="button mx-2" @click.prevent="goToEditor()">New Post</button>
                    <button class="button" @click.prevent="logout">Logout</button>
                </div>
            </div>
        </div>
    </nav>
</template>

<script setup lang="ts">
import axios from "axios";
import { computed, ref } from 'vue';
import { router } from "../services/router";
import { Session, store } from "../services/store";

const username = ref("");
const password = ref("");
const session = computed(() => {
    return store.state.session;
})

function goToEditor() {
    router.push("/editor");
}

async function login() {
    const response = await axios.post<Session>(
        "http://localhost:8080/authenticate",
        new URLSearchParams({
            username: username.value,
            password: password.value,
        }))

    store.commit("login", response.data);
    if (store.getters.getSession.authenticated) {
        username.value = "";
        password.value = "";
    }

    router.push("/");
}

function logout() {
    store.commit("logout");
}

</script>