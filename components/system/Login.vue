<script setup lang="ts">
const props = defineProps<{ visible: boolean }>()

const session = getSession()
const events = useEvents()
const hints = useHints()

const username = ref("")
const password = ref("")

const input = useTemplateRef('usernameInput')
watch(() => props.visible, (visible) => {
    if (visible) {
        nextTick(() => input.value?.focus())
    }
})

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
    catch (ex) {
        wrongAttempts.value += 1
    }
    finally {
        loading.value = false
    }
}

const wrongAttempts = ref(0)
function forgetPassword() {
    closeLogin()
    events.publish(Trigger.showPopup, {
        title: 'Confirm Password Reset',
        message: 'Are you sure you want to reset your password?',
        accept: async () => {
            // TODO allow users to reset their password without being logged in
            await session.useApi(`/api/profile/password/reset`)
            hints.addSuccess("Password reset link sent to your email.")
        },
    })
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
                <input v-model="username" type="text" ref="usernameInput" />
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