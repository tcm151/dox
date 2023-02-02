<script setup lang="ts">
const session = getSession();

const email = ref("");
const username = ref("");
const password = ref("");
const confirmation = ref("");

const register = async () => {
    try {
        await useFetch("/api/register", {
            method: "POST",
            body: {
                email: email.value,
                username: username.value,
                password: password.value,
            }
        })

        session.login(username.value, password.value);
        navigateTo("/profile")
    }
    catch (ex) {
        console.log(ex);
    }
}
</script>

<template>
    <div class="register m-5 p-5">
        <h1 class="mb-4">Register</h1>
        <div class="form">
            <div class="field">
                <label>Email</label>
                <input v-model="email" type="text" placeholder="example@email.com" />
            </div>
            <div class="field">
                <label>Username</label>
                <input v-model="username" type="text" />
            </div>
            <div class="field">
                <label>Password</label>
                <input v-model="password" type="password" />
            </div>
            <div class="field">
                <label>Confirm Password</label>
                <input v-model="confirmation" type="password" />
            </div>
            <div class="row g-2 mt-4">
                <button class="success" @click="register">Register</button>
                <button class="danger">Cancel</button>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
@import "~/assets/global.scss";
.register {
    width: 256px;
    border-radius: 0.5rem;
    background-color: $dox-white-ultra;
}
</style>