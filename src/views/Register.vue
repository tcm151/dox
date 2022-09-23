<script setup lang="ts">
import axios from 'axios';
import bcrypt from "bcryptjs"
import { inject, ref } from 'vue';
import { navigateTo } from '../services/router';
import { Session, store } from '../services/store';

const toggleModal = inject("toggleModal") as Function

const email = ref("");
const username = ref("");
const password = ref("");
const passwordConfirmation = ref("");

async function registerUser() {
    //- assure no fields are missing
    if (email.value == "" || username.value == "" || password.value == "" || passwordConfirmation.value == "") {
        toggleModal("Please supply all fields to register.");
        return;
    }

    //- make sure the passwords match
    if (password.value != passwordConfirmation.value) {
        toggleModal("Passwords do not match.");
        return;
    }

    //- attempt to register user with request to server
    try {
        const response = await axios.post(
            "https://doxforeverything.herokuapp.com/newUser",
            new URLSearchParams({
                email: email.value,
                username: username.value,
                password: await bcrypt.hash(password.value, 10),
            }))
    }
    //- catch a failed attempt
    catch (error) {
        toggleModal("Failed to register user.")
        return;
    }

    login()
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
        navigateTo("/")

    } catch (error) {
        console.log(error)
        toggleModal("Failed to login...", "Double check you typed in your username and password correctly")
    }
}

</script>



<template>
    <form class="box p-6 m-6">
        <div class="field">
            <label class="label">Email</label>
            <div class="control">
                <input class="input" required type="text" v-model="email" />
            </div>
        </div>
        <div class="field">
            <label class="label">Username</label>
            <div class="control">
                <input class="input" required type="text" v-model="username" />
            </div>
        </div>
        <div class="field">
            <label class="label">Password</label>
            <div class="control">
                <input class="input" required type="password" v-model="password" />
            </div>
        </div>
        <div class="field">
            <label class="label">Confirm Password</label>
            <div class="control">
                <input class="input" required type="password" v-model="passwordConfirmation" />
            </div>
        </div>
        <div class="buttons field mt-6">
            <div class="control">
                <button class="button is-primary" @click.prevent="registerUser">Register</button>
            </div>
            <div class="control">
                <button class="button is-danger">Cancel</button>
            </div>
        </div>
    </form>
</template>

<style scope lang="scss">
@import '../styles/global.scss';

.buttons {
    @include flex-h;
    justify-content: space-evenly;
}
</style>