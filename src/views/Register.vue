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
            </div>
        </form>
    </div>

    <div class="modal" v-bind:class="{ 'is-active': showModal }">
        <div class="modal-background"></div>
        <div class="modal-content">
            <div class="card">
                <div class="card-content">
                    <p>{{ modalContent }}</p>
                </div>
            </div>
        </div>
        <button class="modal-close is-large" @click.prevent="toggleModal('')"></button>
    </div>
</template>

<script setup lang="ts">
import axios from 'axios';
import { onUpdated, ref } from 'vue';


const email = ref("");
const username = ref("");
const password = ref("");
const passwordConfirmation = ref("");

const matchingPasswords = ref(true);

const showModal = ref(false);
const modalContent = ref("");

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
            "http://localhost:8080/newUser",
            new URLSearchParams({
                email: email.value,
                username: username.value,
                password: password.value,
            }))
    }
    catch
    {
        // if (response.status == 400) {
            toggleModal("Failed to register user.")
            return;
        // }
    }

    toggleModal("User registered sucessfully!");

    email.value = "";
    username.value = "";
    password.value = "";
    passwordConfirmation.value = "";

}

function toggleModal(newContent: string) {
    modalContent.value = newContent;
    showModal.value = !showModal.value
}

</script>