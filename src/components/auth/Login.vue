<script setup lang="ts">
import axios from 'axios';
import { inject, ref } from 'vue';
import { navigateTo } from '../../services/router';
import { GetSession } from '../../services/store.new';
import { Session } from '../../services/store.new';

defineProps<{ showLogin: boolean }>();

const session = GetSession();

const emit = defineEmits(['openLogin', 'closeLogin'])

const username = ref("")
const password = ref("")

const toggleModal = inject("toggleModal") as Function

function register() {
    emit('closeLogin');
    navigateTo('/register');
}


async function login() {
    try {
        const response = await axios.post<Session>(
            "https://doxforeverything.herokuapp.com/authenticate",
            new URLSearchParams({
                username: username.value,
                password: password.value,
            }))

        session.login(response.data);
        username.value = "";
        password.value = "";
        emit("closeLogin");
        // router.push("/");
        navigateTo("/")

    } catch (error) {
        console.log(error)
        toggleModal("Failed to login...", "Double check you typed in your username and password correctly")
    }
}

</script>


<template>
    <div class="modal" v-bind:class="{ 'is-active': showLogin }">
        <div class="modal-background"></div>
        <div class="login">
            <div class="header">
                <p class="is-size-3">Login</p>
                <button class="delete" @click.prevent="$emit('closeLogin')"></button>
            </div>
            <form class="contents">
                <div class="inputs">
                    <input required class="input" type="username" placeholder="username" v-model="username" />
                    <input required class="input" type="password" placeholder="password" v-model="password" />
                </div>
                <div class="actions">
                    <button type="submit" class="button is-success" @click.prevent="login()">Login</button>
                    <button class="button is-danger" @click.prevent="register()">Register</button>
                </div>
            </form>
        </div>
    </div>
</template>


<style scoped lang="scss">
@import '../../styles/global.scss';

.login {
    @include flex-v;
    z-index: 999;

}

.header {
    @include flex-h;
    align-items: center;
    justify-content: space-between;

    border-radius: 0.25em 0.25em 0 0;
    font-weight: 900;
    padding: 0.5em 1.5em;
    color: $white;
    background-color: $primary;
}

.contents {
    @include flex-v (1em);

    border-radius: 0 0 0.25em 0.25em;
    padding: 2em 2.5em;
    background-color: $white;

    .inputs {
        @include flex-v (0.5em);
    }

    .actions {
        @include flex-h (0.5em);
        justify-content: center;

        button {
            font-weight: 500;
        }
    }
}
</style>