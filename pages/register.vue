<script setup lang="ts">
import Surreal from 'surrealdb.js';

const session = getSession();

const email = ref("");
const username = ref("");
const password = ref("");
const confirmation = ref("");

async function register() {
    try {
        // TODO figure out why this errors occasionally
        // FIXME this doens't even work anymore for some reason
        const { surrealDatabaseUrl } = useRuntimeConfig();
        const db = new Surreal(surrealDatabaseUrl);
        const token = await db.signup({
            NS: "dev",
            DB: "dox",
            SC: "account",
            email: email,
            username: username,
            password: password,
            // votes: {
            //     positive: [],
            //     misleading: [],
            //     negative: [],
            // },
            // topics: ["Admin"],
            // followers: [],
            // following: [],
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
    <div class="column">
        <div class="register p-5">
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
    </div>
</template>

<style scoped lang="scss">
.register {
    width: 256px;
    border-radius: 0.5rem;
    background-color: $dox-white-ultra;
}
</style>