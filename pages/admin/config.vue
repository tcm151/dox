<script setup lang="ts">

const hints = useHints()
const settings = useSettings()

const loading = ref<boolean>(false)
async function saveSettings() {
    try {
        loading.value = true
        await useApi(`/api/admin/config/${settings.app.id}/update`, {
            body: {
                config: settings.app
            }
        })
        hints.addSuccess("Settings saved successfully.")
    }
    catch (error: any) {
        hints.addError(error.message)
    }
    finally {
        loading.value = false
    }
}
</script>


<template>
    <article class="config box column g-4 p-5 m-4">
        <section>
            <ButtonSpinner class="success" :loading="loading" @click="saveSettings">
                <i class="fa-solid fa-floppy-disk"></i>
                <span>Save</span>
            </ButtonSpinner>
            <button class="dark" @click="settings.refresh()">
                <i class="fa-solid fa-rotate"></i>
                <span>Reset</span>
            </button>
        </section>
        <section>
            <header>
                <h2>Email</h2>
            </header>
            <div class="field row center">
                <label class="f-1">support email</label>
                <input type="email" name="supportEmail" class="f-1" v-model="settings.app.email.support">
            </div>
        </section>
        <section>
            <header>
                <h2>Navbar</h2>
            </header>
            <div class="field row center">
                <label class="f-1">show store</label>
                <Toggle v-model:enabled="settings.app.navbar.showStore" />
            </div>
            <div class="field row center">
                <label class="f-1">show feedback</label>
                <Toggle v-model:enabled="settings.app.navbar.showFeedback" />
            </div>
        </section>
        <section>
            <header>
                <h2>Feeds</h2>
            </header>
            <div class="field row center">
                <label class="f-1">show search</label>
                <Toggle v-model:enabled="settings.app.feed.showSearch" />
            </div>
            <div class="field row center">
                <label class="f-1">show topics</label>
                <Toggle v-model:enabled="settings.app.feed.showTopics" />
            </div>
            <div class="field row center">
                <label class="f-1">show threads</label>
                <Toggle v-model:enabled="settings.app.feed.showThreads" />
            </div>
            <div class="field row center">
                <label class="f-1">show images</label>
                <Toggle v-model:enabled="settings.app.feed.showImages" />
            </div>
        </section>
        <section>
            <header>
                <h2>Voting</h2>
            </header>
            <div class="field row center">
                <label class="f-1">enable misleading votes</label>
                <Toggle v-model:enabled="settings.app.voting.showMisleading" />
            </div>
            <div class="field row center">
                <label class="f-1">enabled negative votes</label>
                <Toggle v-model:enabled="settings.app.voting.showNegative" />
            </div>
        </section>
        <section>
            <header>
                <h2>Media</h2>
            </header>
            <div class="field row center">
                <label class="f-1">allow uploads</label>
                <Toggle v-model:enabled="settings.app.media.uploads.enabled" />
            </div>
            <div class="field row center">
                <label class="f-1">audio limit (megabytes)</label>
                <input
                    type="number"
                    min="1" step="1"
                    :disabled="!settings.app.media.uploads.enabled"
                    v-model.number="settings.app.media.uploads.audioMaxSize"
                >
            </div>
            <div class="field row center">
                <label class="f-1">image limit (megabytes)</label>
                <input
                    type="number"
                    min="1" step="1"
                    :disabled="!settings.app.media.uploads.enabled"
                    v-model.number="settings.app.media.uploads.imageMaxSize"
                >
            </div>
        </section>
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width(40rem, 1rem);
}

article.config {
    div.field {
        margin-block: 0.5rem;
    }
    input {
        padding: 0.25rem 0.5rem;
        font-size: 0.8rem;
    }
    input[type="text"], input[type="email"] {
        max-width: 12rem;
        text-align: right;
    }
    input[type="number"] {
        text-align: center;
        max-width: 8rem;
    }
}
</style>