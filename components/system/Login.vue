<script setup lang="ts">
defineProps<{ visible: boolean }>()

const session = getSession()
const events = useEvents()
const hints = useHints()

const username = ref("")
const password = ref("")

events.subscribe(Trigger.toggleLogin, (name?: string) => {
    if (name) username.value = name
})

function closeLogin() {
    events.publish(Trigger.toggleLogin)
    wrongAttempts.value = 0
}

const loading = ref<boolean>(false)
async function attemptLogin() {
    loading.value = true
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
    loading.value = false
}

const wrongAttempts = ref(0)
function forgetPassword() {
    hints.addWarning('We are still working on this...')
    // TODO allow users to reset their password without being logged in
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
</script>

<template>
    <Popup
        title="Login"
        width="20rem"
        :visible="visible"
        :loading="loading"
        accept-label="Login"
        @accept="attemptLogin"
        decline-label="Cancel"
        @decline="closeLogin"
    >
        <main class="login form">
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