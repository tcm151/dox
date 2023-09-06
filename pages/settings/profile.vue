<script setup lang="ts">
const hints = useHints()
const session = getSession()

function validDescription() {
    return session.user.description !== '' ? /^[\w\W]{0,256}$/.test(session.user.description!) : true
}

async function sendConfirmation() {
    await session.useApi("/api/profile/confirm/send")
    hints.addSuccess("Confirmation sent!")
    await new Promise(resolve => setTimeout(resolve, 1024));
    hints.addError("Expires in 15 minutes...")
}

async function updateProfile() {
    if (!validDescription()) {
        hints.addWarning("Description must be shorter than 256 characters.")
        return
    }

    try {
        await session.useApi("/api/profile/update", session.user)
        await session.fetchProfile()
    }
    catch (ex: any) {
        hints.addError("Failed to update profile.")
    }
}

const events = useEvents()

async function resetPassword() {
    events.publish(Trigger.showPopup, {
        title: 'Confirm Password Reset',
        message: 'Are you sure you want to reset your password?',
        accept: async () => {
            try {
                await session.useApi(`/api/profile/password/reset`)
                hints.addSuccess("Password reset link sent to your email.")
            }
            catch (ex: any) {
                hints.addError("Failed to send reset link.")
            }
        },
    })
}
</script>

<template>
    <article class="column g-4 p-4">
        <section class="box column g-4 p-5">
            <div class="column g-2">
                <button class="fill danger" @click="sendConfirmation" v-if="!session.user.confirmed">
                    Confirm Account
                </button>
                <button class="fill success" v-else>
                    Account Confirmed
                </button>
                <button class="link" @click="resetPassword">
                    Reset Password
                </button>
            </div>
            <div class="form">
                <div class="field">
                    <label>Email</label>
                    <input disabled type="text" v-model="session.user.email"/>
                </div>
                <div class="field">
                    <label>Username</label>
                    <input disabled type="text" v-model="session.user.name"/>
                </div>
                <div class="field">
                    <label>Link</label>
                    <input type="text" v-model="session.user.link"/>
                </div>
                <div class="field">
                    <label>Description</label>
                    <textarea :class="{ invalid: !validDescription() }" rows="6" v-model="session.user.description"/>
                </div>
            </div>
            <div class="row g-2">
                <button class="success" @click="updateProfile">
                    <i class="fa-solid fa-floppy-disk"></i>
                    <span>Update</span>
                </button>
                <button class="danger" @click="session.fetchProfile">
                    <i class="fa-solid fa-ban"></i>
                    <span>Cancel</span>
                </button>
            </div>
        </section>
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width(600px, 1rem);
}

textarea {
    resize: none !important;
}

div.profile-picture {
    img {
        border-radius: 0.5rem;
    }
}

input.invalid, textarea.invalid {
    outline: 1px solid $dox-red !important;
}

input[disabled] {
    color: $dox-white-3;
}

input[disabled]:hover {
    outline: 1px solid $dox-white-2;
    cursor: not-allowed;
}
</style>