<script setup lang="ts">

const hints = useHints()
const session = getSession()
const settings = useSettings()

watch(settings.app, async (updatedConfig) => {
    try {
        await session.useApi("/api/admin/config/update", { config: updatedConfig })
    }
    catch (error: any) {
        hints.addError(error.message)
    }
})


</script>


<template>
    <article class="box form column g-4 p-5 m-4">
        <section>
            <header>
                <h2>Navbar</h2>
            </header>
            <div class="field row center py-2">
                <label class="f-1">show store</label>
                <Toggle v-model:enabled="settings.app.navbar.showStore" />
            </div>
            <div class="field row center py-2">
                <label class="f-1">show feedback</label>
                <Toggle v-model:enabled="settings.app.navbar.showFeedback" />
            </div>
        </section>
        <section>
            <header>
                <h2>Feeds</h2>
            </header>
            <div class="field row center py-2">
                <label class="f-1">show search</label>
                <Toggle v-model:enabled="settings.app.feed.showSearch" />
            </div>
            <div class="field row center py-2">
                <label class="f-1">show topics</label>
                <Toggle v-model:enabled="settings.app.feed.showTopics" />
            </div>
            <div class="field row center py-2">
                <label class="f-1">show threads</label>
                <Toggle v-model:enabled="settings.app.feed.showThreads" />
            </div>
            <div class="field row center py-2">
                <label class="f-1">show images</label>
                <Toggle v-model:enabled="settings.app.feed.showImages" />
            </div>
        </section>
        <section>
            <header>
                <h2>Voting</h2>
            </header>
            <div class="field row center py-2">
                <label class="f-1">show misleading</label>
                <Toggle v-model:enabled="settings.app.voting.showMisleading" />
            </div>
            <div class="field row center py-2">
                <label class="f-1">show negative</label>
                <Toggle v-model:enabled="settings.app.voting.showNegative" />
            </div>
        </section>
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width(40rem, 1rem);
}

section.form {
    input {
        max-width: 8rem;
    }
}
</style>