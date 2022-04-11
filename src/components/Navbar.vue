<template>
    <nav class="navbar has-background-primary">
        <div class="navbar-brand">
            <router-link to="/" class="navbar-item my-auto is-size-2 has-text-weight-bold has-text-dark">DOX
            </router-link>
            <p class="navbar-item is-size-4 has-text-weight-semibold pl-0">For Everything</p>
        </div>
        <div class="navbar-menu is-active">
            <div class="navbar-end">
                <form class="navbar-item field is-grouped" v-if="!session.authenticated">
                    <input class="input" type="username" placeholder="username" v-model="username" required />
                    <input class="input ml-2 mr-1" type="password" placeholder="password" v-model="password" required />
                    <button type="submit" class="button ml-1 mr-2" @click.prevent="login">Login</button>
                    <router-link class="navbar-item button" to="/register">Register</router-link>
                </form>
                <div class="navbar-item" v-else>
                    <router-link to="/profile">
                        <button class="button has-text-weight-bold has-background-primary-light">{{
                            session.user?.username
                        }}</button>
                    </router-link>
                    <router-link to="/editor">
                        <button class="button mx-2">New Post</button>
                    </router-link>
                    <button class="button" @click.prevent="logout">Logout</button>
                </div>
            </div>
        </div>
    </nav>
</template>

<script setup lang="ts">
import axios from "axios";
import { computed, inject, ref } from 'vue';
import { router } from "../services/router";
import { Session, store } from "../services/store";

const session = computed(() => {
    return store.state.session;
})

const username = ref("");
const password = ref("");

const toggleModal = inject("toggleModal") as Function

async function login() {
    try {
        const response = await axios.post<Session>(
            "https://doxforeverything.herokuapp.com/authenticate",
            new URLSearchParams({
                username: username.value,
                password: password.value,
            }))

        store.commit("login", response.data);
        username.value = "";
        password.value = "";
        router.push("/");

    } catch (error) {
        console.log(error)
        toggleModal("Failed to login...", "Double check you typed in your username and password correctly")
    }

}

function logout() {
    store.commit("logout");
    router.push("/");
}

</script>