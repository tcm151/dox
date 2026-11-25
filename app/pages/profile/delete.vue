<script setup lang="ts">
const hints = useHints()
const session = getSession()

const password = ref("")
const confirmation = ref("")
const loading = ref(false)

async function deleteAccount(mode: "delete" | "wipe") {
    if (confirmation.value !== session.user.name) {
        hints.addWarning("Type your exact username to confirm account deletion.")
        return
    }
    if (!password.value) {
        hints.addWarning("Enter your current password to confirm account deletion.")
        return
    }

    try {
        loading.value = true
        await useApi(`/api/profile/account/${mode}`, {
            method: "POST",
            body: {
                password: password.value,
                confirmation: confirmation.value,
            },
        })
        hints.addSuccess(mode === "delete"
            ? "Your account was deleted. Your published content remains under the deleted attribution."
            : "Your account and eligible content were deleted.")
        await session.logout(true)
    }
    catch (error: any) {
        hints.addError("Unable to delete your account.", error)
    }
    finally {
        loading.value = false
    }
}
</script>

<template>
    <article class="column g-4 p-4">
        <section class="box column g-2 p-5">
            <h2>Delete your account</h2>
            <p>Deletion is permanent. Your account, login, and private account data will be removed. Existing votes and other historical interactions are preserved. Enter your current password and type your exact username to confirm.</p>
            <label class="field">
                <span>Current password</span>
                <input v-model="password" type="password" autocomplete="current-password">
            </label>
            <label class="field">
                <span>Type <strong>{{ session.user.name }}</strong> to confirm</span>
                <input v-model="confirmation" type="text" autocomplete="off">
            </label>
        </section>
        <section class="box column g-2 p-5">
            <h3>Keep my published content</h3>
            <p>Your posts, comments, threads, galleries, and uploaded media stay available for historical completeness. Their author will be shown as “deleted”. Drafts and private account data are removed.</p>
            <ButtonSpinner class="warning" :loading="loading" :disabled="confirmation !== session.user.name || !password" @click="deleteAccount('delete')">
                Delete account and keep content
            </ButtonSpinner>
        </section>
        <section class="box column g-2 p-5">
            <h3>Delete my content too</h3>
            <p>Content with comments, replies, or quotes from other users stays in the database with its text and attachments removed, attributed to “deleted”. Content without those interactions is permanently removed. Votes and other historical interactions are preserved. Media still used by another user’s content is retained anonymously.</p>
            <ButtonSpinner class="danger" :loading="loading" :disabled="confirmation !== session.user.name || !password" @click="deleteAccount('wipe')">
                Delete account and content
            </ButtonSpinner>
        </section>
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width(40rem, 1rem);
}
</style>
