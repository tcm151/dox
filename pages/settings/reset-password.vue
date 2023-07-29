<script setup lang="ts">
definePageMeta({
    layout: 'simple'
})

const hints = useHints()
const events = useEvents()
const valid = useValidation()

const route = useRoute()
const resetId = route.query['id']

const email = ref("")
const password = ref("")
const confirmation = ref("")

async function resetPassword() {

    if (!valid.email.test(email.value)) {
        hints.addError("Invalid email.")
        return
    }

    if (!valid.password.test(password.value) || !valid.password.test(confirmation.value)) {
        hints.addError("Invalid password.")
        return
    } 

    if (password.value !== confirmation.value) {
        hints.addWarning("Passwords entered are not identical")
        return
    }

    try {
        await $fetch("/api/profile/password/confirm", {
            method: "POST",
            body: {
                resetId: resetId,
                email: email.value,
                password: password.value
            }
        })
        email.value = ""
        password.value = ""
        confirmation.value = ""
        events.publish(Trigger.toggleLogin)
        navigateTo("/feed")
    }
    catch (ex: any) {
        hints.addError("Failed to reset password.")
    }
}

function invalidEmail() {
    return email.value !== '' && !valid.email.test(email.value)
}

function invalidPassword(password: string) {
    return password !== '' && !valid.password.test(password)
}

function differentPasswords() {
    return confirmation.value !== '' && password.value !== confirmation.value
}
</script>

<template>
    <article class="column g-4 p-6">
        <section class="box form column g-4 p-5">
            <h2>Reset Password</h2>
            <div class="field mt-2">
                <label>Email</label>
                <input type="email" :class="{ invalid: invalidEmail() }" v-model="email" />
            </div>
            <div class="field">
                <label>New Password</label>
                <input type="password" :class="{ invalid: invalidPassword(password) || differentPasswords() }" v-model="password" />
            </div>
            <div class="field">
                <label>Confirm Password</label>
                <input type="password" :class="{ invalid: invalidPassword(confirmation) || differentPasswords() }" v-model="confirmation" />
            </div>
            <div class="row g-2 mt-2">
                <button class="success" @click="resetPassword">
                    <i class="fa-solid fa-key"></i>
                    <span>Confirm Password</span>
                </button>
                <button class="danger">
                    <i class="fa-solid fa-ban"></i>
                    <span>Cancel</span>
                </button>
            </div>
        </section>
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width(400px, 1rem);
}

.field {
    input.invalid {
        outline: 1px solid $dox-red !important;
    }
}
</style>