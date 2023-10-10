<script setup lang="ts">
defineProps<{ visible: boolean }>()

const session = getSession()
const events = useEvents()
const hints = useHints()

const username = ref("")
const password = ref("")

const wrongAttempts = ref(0)

async function attemptLogin() {
    if (await session.login(username.value, password.value)) {
        events.publish(Trigger.toggleLogin)
        wrongAttempts.value = 0
        username.value = ""
        password.value = ""
    }
    else {
        hints.addError("Username or password were incorrect.")
        wrongAttempts.value += 1
    }
}

function forgetPassword() {
    hints.addWarning('We are still working on this...')
    // events.publish(Trigger.showPopup, {
    //     title: 'Confirm Password Reset',
    //     message: 'Are you sure you want to reset your password?',
    //     accept: async () => {
    //         try {
    //             await session.useApi(`/api/profile/password/reset`)
    //             hints.addSuccess("Password reset link sent to your email.")
    //         }
    //         catch (ex: any) {
    //             hints.addError("Failed to send reset link.")
    //         }
    //     },
    // })
    // navigateTo("/register")
    // closeLogin()
}

function closeLogin() {
    events.publish(Trigger.toggleLogin)
    wrongAttempts.value = 0
}
</script>

<template>
    <Popup :visible="visible" title="Login" accept-label="Login" @accept="attemptLogin" decline-label="Cancel" @decline="closeLogin">
        <div class="login form">
            <div class="field">
                <label>Username</label>
                <input v-model="username" type="text" />
            </div>
            <div class="field">
                <label class="forgot" v-if="wrongAttempts >= 3">
                    <NuxtLink @click="forgetPassword">
                        Forget your password?
                    </NuxtLink>
                </label>
                <label v-else>
                    <span>Password</span>
                </label>
                <input v-model="password" @keyup.enter="attemptLogin" type="password" />
            </div>
        </div>
    </Popup>
</template>

<style scoped lang="scss">
.form {
    width: 256px;
}

label.forgot {
    a {
        color: $dox-red;
        text-decoration: underline;
        cursor: pointer;
    }
}
</style>