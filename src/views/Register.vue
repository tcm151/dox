<template>
    <div class="columns my-6 is-centered">
        <form class="column box p-6 is-5">
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
                <!-- <p class="help is-danger" v-if="!matchingPasswords">Passwords do not match</p> -->
            </div>
            <div class="field">
                <label class="label">Confirm Password</label>
                <div class="control">
                    <input class="input" required type="password" v-model="passwordConfirmation" />
                </div>
                <!-- <p class="help is-danger" v-if="!matchingPasswords">Passwords do not match</p> -->
            </div>
            <div class="field columns is-centered is-grouped mt-6">
                <div class="control">
                    <button class="button is-primary" @click.prevent="registerUser">Register</button>
                </div>
                <div class="control">
                    <button class="button is-danger">Cancel</button>
                </div>
                <!-- <div class="control">
                    <button class="button is-warning"
                        @click.prevent="toggleModal('Failed to do something...', 'Additional information about the issue', 'Buttons and stuff')">Modal</button>
                </div> -->
            </div>
        </form>
    </div>
</template>

<script setup lang="ts">
import axios from 'axios';
import { inject, onUpdated, ref } from 'vue';

import bcrypt from "bcryptjs"
import { router } from '../services/router';

const toggleModal = inject("toggleModal") as Function


const email = ref("");
const username = ref("");
const password = ref("");
const passwordConfirmation = ref("");

const matchingPasswords = ref(true);


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

    // toggleModal("User registered sucessfully!");

    email.value = "";
    username.value = "";
    password.value = "";
    passwordConfirmation.value = "";
    router.push("/")
}

</script>