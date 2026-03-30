<script setup lang="ts">
definePageMeta({
    layout: 'simple'
})

const hints = useHints()
const valid = useValidation()
const events = useEvents()

const route = useRoute()
const resetId = route.query['id']

const email = ref("")
const password = ref("")
const confirmation = ref("")

async function resetPassword() {

    if (!valid.user.email(email.value)) {
        hints.addError("Invalid email.")
        return
    }

    if (!valid.user.password(password.value) || !valid.user.password(confirmation.value)) {
        hints.addError("Invalid password.")
        return
    } 

    if (password.value !== confirmation.value) {
        hints.addWarning("Passwords entered are not identical")
        return
    }

    await useApi("/api/profile/password/confirm", {
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

function invalidEmail() {
    return email.value !== '' && !valid.user.email(email.value)
}

function invalidPassword(password: string) {
    return password !== '' && !valid.user.password(password)
}

function differentPasswords() {
    return confirmation.value !== '' && password.value !== confirmation.value
}
</script>

<template>
    <article class="column g-4 p-6">
        <section class="box form column g-4 p-5">
            <h2>Reset Password</h2>
            <div class="field mt-2" :class="{ invalid: invalidEmail() }">
                <label>Email</label>
                <input type="email" v-model="email" />
            </div>
            <div class="field" :class="{ invalid: invalidPassword(password) || differentPasswords() }">
                <label>New Password</label>
                <input type="password" v-model="password" />
            </div>
            <div class="field" :class="{ invalid: invalidPassword(confirmation) || differentPasswords() }">
                <label>Confirm Password</label>
                <input type="password" v-model="confirmation" />
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
    @include fit-width(30rem, 1rem);
}
</style>