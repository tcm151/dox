<script setup lang="ts">
import type { Account } from "@@/shared/types"

const hints = useHints()
const valid = useValidation()
const events = useEvents()
const session = getSession()

const { data: account } = await useDatasource<Account>("/api/profile/account")

function validDescription() {
    return session.user.description !== '' ? valid.user.description(session.user.description!) : true
}

async function sendConfirmation() {
    await useApi("/api/profile/confirm/send")
    hints.addSuccess("Confirmation sent! Expires in 15 minutes...")
}

const username = ref<string>(session.user.name)
function invalidUsername() {
    return usernameTaken.value || !valid.user.name(username.value)
}

const usernameTaken = ref<boolean>(false)
async function checkUsernameTaken() {
    usernameTaken.value = await useApi("/api/profile/username-taken", {
        body: {
            username: username.value
        }
    })
}

const loading = ref<boolean>(false)
async function updateProfile() {
    if (usernameTaken.value) {
        hints.addError("That username is already taken")
        return
    }
    if (!validDescription()) {
        hints.addWarning("Description must be shorter than 256 characters.")
        return
    }
    try {
        loading.value = true
        await useApi("/api/profile/update", {
            body: {
                name: username.value,
                link: session.user.link,
                description: session.user.description,
            }
        })
        hints.addSuccess("Updated your profile successfully.")
        await session.refreshProfile()
    }
    catch (error: any) {
        hints.addError("Failed to update your profile.")
    }
    finally {
        loading.value = false
    }
}

async function resetProfile() {
    await session.refreshProfile()
    username.value = session.user.name
    usernameTaken.value = false
}

async function resetPassword() {
    events.publish(Trigger.showPopup, {
        title: 'Confirm Password Reset',
        message: 'Are you sure you want to reset your password?',
        accept: async () => {
            await useApi(`/api/profile/password/reset`, {
                body: {
                    id: account.value?.email
                }
            })
            hints.addSuccess("Password reset link sent to your email.")
        },
    })
}
</script>

<template>
    <article class="m-4">
        <section class="box column g-4 p-5">
            <div class="column g-2">
                <button v-if="!hasTrait(session.user, 'confirmed')" class="f-1 danger" @click="sendConfirmation">
                    Confirm Account
                </button>
                <button class="f-1 success" v-else>
                    Account Confirmed
                </button>
                <button class="link" @click="resetPassword">
                    Reset Password
                </button>
            </div>
            <div class="form">
                <div v-if="account" class="field">
                    <label>Email</label>
                    <input disabled type="text" :value="account.email"/>
                </div>
                <div class="field" :class="{ invalid: invalidUsername() }">
                    <label>Username</label>
                    <input type="text" v-model="username" @change="checkUsernameTaken" />
                    <span v-if="usernameTaken" class="tip">That username has already been taken.</span>
                </div>
                <div class="field">
                    <label>Link</label>
                    <input type="text" v-model="session.user.link" />
                </div>
                <div class="field" :class="{ invalid: !validDescription() }">
                    <label>Description</label>
                    <textarea rows="6" v-model="session.user.description"/>
                </div>
            </div>
            <div class="row g-2">
                <ButtonSpinner class="success f-1" :loading="loading" @click="updateProfile">
                    <i class="fa-solid fa-floppy-disk"></i>
                    <span>Update</span>
                </ButtonSpinner>
                <button class="dark" @click="resetProfile">
                    <i class="fa-solid fa-refresh"></i>
                    <span>Reset</span>
                </button>
            </div>
        </section>
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width(40rem, 1rem);
}

textarea {
    resize: none !important;
}

div.profile-picture {
    img {
        border-radius: 0.5rem;
    }
}
</style>