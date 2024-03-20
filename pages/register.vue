<script setup lang="ts">
definePageMeta({
    layout: 'middle'
})

const route = useRoute()
const referrer = route.query['referral']

const hints = useHints()
const session = getSession()
const valid = useValidation()

const email = ref("")
const username = ref("")
const password = ref("")
const confirmation = ref("")

async function register() {
    try {
        if (!valid.email.test(email.value)) {
            hints.addError("Invalid email.")
            return
        }

        if (!valid.username.test(username.value)) {
            hints.addError("Invalid username.")
            return
        } 

        if (!valid.password.test(password.value) || !valid.password.test(confirmation.value)) {
            hints.addError("Invalid password.")
            return
        } 

        session.token = await $fetch<string>("/api/user/register", {
            method: "POST",
            body: {
                email: email.value,
                username: username.value,
                password: password.value,
                referral: referrer
            },
        })

        hints.addSuccess('Created account successfully!')
        await session.authenticate()
        navigateTo('/profile')
    }
    catch (ex: any) {
        hints.addError(ex.message)
    }
}

function invalidEmail() {
    return email.value !== '' && !valid.email.test(email.value)
}

function invalidUsername() {
    return username.value !== '' && !valid.username.test(username.value)
}

function invalidPassword(password: string) {
    return password !== '' && !valid.password.test(password)
}

function differentPasswords() {
    return confirmation.value !== '' && password.value !== confirmation.value
}
</script>

<template>
    <article class="column g-2">
        <div style="text-align: center;" v-if="referrer">
            <p>Referral: {{ referrer }}</p>
        </div>
        <div class="register p-5">
            <h1 class="mb-4">Register</h1>
            <div class="form">
                <div class="field">
                    <label>Email</label>
                    <input
                        type="email"
                        spellcheck="false"
                        :class="{ invalid: invalidEmail() }"
                        v-model="email"
                    />
                </div>
                <div class="field">
                    <label>Username</label>
                    <input
                        type="text"
                        spellcheck="false"
                        title="/^[\w]{3,32}$/"
                        :class="{ invalid: invalidUsername() }"
                        v-model="username"
                    />
                </div>
                <div class="field">
                    <label>Password</label>
                    <input
                        type="password"
                        spellcheck="false"
                        title="/^[\S]{8,64}$/"
                        :class="{ invalid: invalidPassword(password) }"
                        v-model="password"
                        />
                    </div>
                    <div class="field">
                        <label>Confirm Password</label>
                        <input
                        type="password"
                        spellcheck="false"
                        title="/^[\S]{8,64}$/"
                        @keydown.enter="register"
                        :class="{ invalid: invalidPassword(confirmation) || differentPasswords() }"
                        v-model="confirmation"
                    />
                </div>
                <div class="row g-2 mt-4">
                    <button class="success fill" @click="register">
                        Register
                    </button>
                    <button class="danger fill" @click="navigateTo('/home')">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    </article>
</template>

<style scoped lang="scss">
.register {
    width: 256px;
    border-radius: 0.5rem;
    background-color: $white-0;
}

.field {
    input.invalid {
        outline: 1px solid $red !important;
    }
}
</style>