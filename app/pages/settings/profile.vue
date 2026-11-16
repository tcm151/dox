<script setup lang="ts">
import type { Account } from "@@/shared/types"

const hints = useHints()
const valid = useValidation()
const session = getSession()

const { data: account } = await useAuthenticatedDatasource<Account>("/api/profile/account")

function validDescription() {
    return session.user.description !== '' ? valid.user.description(session.user.description!) : true
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
        hints.addWarning("That username is already taken")
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
        hints.addError("Failed to update your profile.", error)
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


</script>

<template>
    <article class="column g-4 m-4">
        <header class="row wrap inline between g-2">
            <h1>Profile</h1>
            <div class="row wrap g-2">
                <ButtonSpinner class="success" :loading="loading" @click="updateProfile">
                    <i class="fa-solid fa-floppy-disk"></i>
                    <span>Update</span>
                </ButtonSpinner>
                <button @click="resetProfile">
                    <i class="fa-solid fa-refresh"></i>
                    <span>Cancel</span>
                </button>
            </div>
        </header>
        <section class="box column g-4 p-5">
            <h2>User Information</h2>
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
                    <MarkdownEditor bounded :rows="6" v-model="session.user.description" />
                </div>
            </div>
        </section>
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width(50rem, 1rem);
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