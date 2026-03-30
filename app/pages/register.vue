<script setup lang="ts">
definePageMeta({
    layout: 'middle'
})

const route = useRoute()
const referrer = route.query['referral']

const hints = useHints()
const valid = useValidation()
const session = getSession()

const email = ref("")
const username = ref("")
const password = ref("")
const confirmation = ref("")

const submitting = ref<boolean>(false)
async function register() {
    if (!valid.user.email(email.value)) {
        hints.addError("Invalid email.")
        return
    }

    if (!valid.user.name(username.value)) {
        hints.addError("Invalid username.")
        return
    } 

    if (!valid.user.password(password.value) || !valid.user.password(confirmation.value)) {
        hints.addError("Invalid password.")
        return
    } 

    try {
        submitting.value = true
        const result = await useApi("/api/user/register", {
            body: {
                email: email.value,
                username: username.value,
                password: password.value,
                referral: referrer,
            },
        })

        await session.authenticate(result)
        hints.addSuccess('Created account successfully!')
        navigateTo('/profile')
    }
    catch (error: any) {
        hints.addError("Failed to register your account.")
    }
    finally {
        submitting.value = false
    }
}

function invalidEmail() {
    return email.value !== '' && !valid.user.email(email.value)
}

function invalidUsername() {
    return username.value !== '' && !valid.user.name(username.value)
}

function invalidPassword(password: string) {
    return password !== '' && !valid.user.password(password)
}

function differentPasswords() {
    return confirmation.value !== '' && password.value !== confirmation.value
}
</script>

<template>
    <article class="column g-2">
        <div v-if="referrer" class="text center">
            <p>Referral: {{ referrer }}</p>
        </div>
        <div class="register box br-medium p-5">
            <h1 class="mb-4">Register</h1>
            <div class="form">
                <div class="field" :class="{ invalid: invalidEmail() }">
                    <label>Email</label>
                    <input
                        type="email"
                        spellcheck="false"
                        v-model="email"
                    />
                </div>
                <div class="field" :class="{ invalid: invalidUsername() }">
                    <label>Username</label>
                    <input
                        type="text"
                        spellcheck="false"
                        title="/^[\w]{3,32}$/"
                        v-model="username"
                    />
                </div>
                <div class="field" :class="{ invalid: invalidPassword(password) }">
                    <label>Password</label>
                    <input
                        type="password"
                        spellcheck="false"
                        title="/^[\S]{8,64}$/"
                        v-model="password"
                        />
                    </div>
                    <div class="field" :class="{ invalid: invalidPassword(confirmation) || differentPasswords() }">
                        <label>Confirm Password</label>
                        <input
                        type="password"
                        spellcheck="false"
                        title="/^[\S]{8,64}$/"
                        @keydown.enter="register"
                        v-model="confirmation"
                    />
                </div>
                <div class="row g-2 mt-4">
                    <button class="success f-1" @click="register">
                        <i class="fa-solid fa-paper-plane"></i>
                        Register
                    </button>
                    <button class="danger" @click="navigateTo('/feed')">
                        <i class="fa-solid fa-ban"></i>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width(30rem, 1rem);
}
</style>