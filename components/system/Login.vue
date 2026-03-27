<script setup lang="ts">
const hints = useHints()
const events = useEvents()
const session = getSession()

const username = ref("")
const password = ref("")

events.subscribe(Trigger.toggleLogin, (name?: string) => {
    if (name) username.value = name
})

function closeLogin() {
    username.value = ""
    password.value = ""
    wrongAttempts.value = 0
    events.publish(Trigger.toggleLogin)
}

const loading = ref<boolean>(false)
async function attemptLogin() {
    try {
        loading.value = true
        await session.login(username.value, password.value)
        closeLogin()
    }
    catch (error: any) {
        wrongAttempts.value += 1
        hints.addError("Failed to authenticate.")
    }
    finally {
        loading.value = false
    }
}

const wrongAttempts = ref(0)
function forgetPassword() {
    events.publish(Trigger.showPopup, {
        title: 'Confirm Password Reset',
        message: 'Are you sure you want to reset your password?',
        accept: async () => {
            await useApi(`/api/profile/password/reset`, {
                body: {
                    id: username.value
                }
            })
            hints.addSuccess("Password reset link sent to your email.")
        },
    })
    closeLogin()
}
</script>

<template>
    <Popup title="Login" width="20rem" :loading="loading" :accept="{ label: 'Login', action: attemptLogin }" :decline="{ label: 'Cancel', action: closeLogin }">
        <main class="login form">
            <div class="field">
                <label>Username</label>
                <input v-model="username" type="text" ref="usernameInput" />
            </div>
            <div class="field">
                <label v-if="wrongAttempts >= 3" class="forgot">
                    <NuxtLink @click="forgetPassword">
                        Forget your password?
                    </NuxtLink>
                </label>
                <label v-else>
                    <span>Password</span>
                </label>
                <input v-model="password" @keyup.enter="attemptLogin" type="password" />
            </div>
        </main>
    </Popup>
</template>

<style scoped lang="scss">
label.forgot {
    a {
        color: $red;
        text-decoration: underline;
        cursor: pointer;
    }
}
</style>