<script setup lang="ts">
import axios from 'axios';
import { inject, ref } from 'vue';
import { onBeforeRouteUpdate } from 'vue-router';
import { router } from '../../services/router';
import { Session, store } from '../../services/store';

defineProps<{ showLogin: boolean }>();
const emits = defineEmits(['openLogin', 'closeLogin'])

const username = ref("")
const password = ref("")

const toggleModal = inject("toggleModal") as Function

function navigateTo(route: string) {
    emits("closeLogin")
    router.push(route);
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
        emits("closeLogin");
        router.push("/");

    } catch (error) {
        console.log(error)
        toggleModal("Failed to login...", "Double check you typed in your username and password correctly")
    }
}

</script>


<template>
    <div class="modal" v-bind:class="{ 'is-active': showLogin }">
        <div class="modal-background"></div>
        <div class="modal-content message is-info is-large mx-6">
            <div class="message-header">
                <p class="is-size-3">Login</p>
                <button class="delete" @click.prevent="$emit('closeLogin')"></button>
            </div>
            <div class="message-body p-6">
                <form class="fields px-6">
                    <div class="field py-1">
                        <div class="control">
                            <input class="input is-medium" type="username" placeholder="username" v-model="username"
                                required />
                        </div>
                    </div>
                    <div class="field py-1">
                        <div class="control">
                            <input class="input is-medium" type="password" placeholder="password" v-model="password"
                                required />
                        </div>
                    </div>
                    <div class="field py-1 is-grouped is-grouped-centered">
                        <div class="control buttons">
                            <button type="submit" class="button is-medium is-primary"
                                @click.prevent="login()">Login</button>
                            <button class="button is-danger is-medium"
                                @click.prevent="navigateTo('/register')">Register</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>


<style scoped>
.modal-content {
    max-width: 512px;
}
</style>