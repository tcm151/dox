<template>
    <div class="modal" v-bind:class="{ 'is-active': showLogin }">
        <div class="modal-background"></div>
        <div class="modal-card">
            <div class="modal-card-head">
                <p class="modal-card-title">Login</p>
                <button class="delete" @click.prevent="closePopup()"></button>
            </div>
            <div class="modal-card-body">
                <form class="navbar-item field is-grouped">
                    <input class="input" type="username" placeholder="username" v-model="username" required />
                    <input class="input ml-2 mr-1" type="password" placeholder="password" v-model="password" required />
                    <button type="submit" class="button ml-1 mr-2" @click.prevent="login">Login</button>
                    <router-link class="navbar-item button" to="/register">Register</router-link>
                </form>
            </div>
            <div class="modal-card-foot">
                <p>Footer</p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import axios from 'axios';
import { inject, ref } from 'vue';
import { router } from '../services/router';
import { Session, store } from '../services/store';

const username = ref("")
const password = ref("")
const showLogin = ref(false)

const toggleModal = inject("toggleModal") as Function

function closePopup() {
    showLogin.value = false;
}

function logout() {
    store.commit("logout");
    router.push("/");
}

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


</script>