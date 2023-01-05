<script setup lang="ts">
import axios from 'axios';
import bcrypt from "bcryptjs"
import { ref, inject } from 'vue';
import { storeKey } from 'vuex';
import { navigateTo } from '../services/router';
import { GetSession } from '../services/store.new';

const toggleModal = inject("toggleModal") as Function

const session = GetSession();

const email = ref("");
const username = ref("");
const password = ref("");
const passwordConfirmation = ref("");

async function registerUser() {
    if (email.value == "" || username.value == "" || password.value == "" || passwordConfirmation.value == "") {
        toggleModal("Please supply all fields to register.");
        return;
    }

    if (password.value != passwordConfirmation.value) {
        toggleModal("Passwords do not match.");
        return;
    }

    try {
        const response = await axios.post(
            "http://172.105.97.135:8080/newUser",
            new URLSearchParams({
                email: email.value,
                username: username.value,
                password: await bcrypt.hash(password.value, 10),
            }))
    }
    catch (error) {
        toggleModal("Failed to register user.")
        return;
    }

    login()
}

async function login() {
    try {
        const response = await axios.post(
            "http://172.105.97.135:8080/authenticate",
            new URLSearchParams({
                username: username.value,
                password: password.value,
            }))

        session.login(response.data);
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
    <div class="register">
        <form class="box p-5 m-5">
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
                    <button class="button is-primary mr-4" @click.prevent="registerUser">Register</button>
                </div>
                <div class="control">
                    <button class="button is-danger">Cancel</button>
                </div>
            </div>
        </form>
    </div>
</template>

<style scope lang="scss">
@import '../styles/global.scss';

.register {
    @include flex-h;
    justify-content: center;

    .box {
        flex: 1 1 auto;
        max-width: 500px;
    }
}

.buttons {
    @include flex-h;
    justify-content: space-evenly;
}
</style>