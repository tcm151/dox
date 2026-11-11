<script setup lang="ts">

const hints = useHints()
const cache = useCache()
const defaults = useSettings()
const settings = ref({ ...defaults.app })
const resetting = ref(false)

async function refreshSettings() {
    resetting.value = true
    try {
        await defaults.refresh()
        settings.value = { ...defaults.app }
    }
    finally {
        resetting.value = false
    }
}

const loading = ref<boolean>(false)
async function saveSettings() {
    try {
        loading.value = true
        await useApi(`/api/admin/settings/${extractId(defaults.app.id)}/update`, {
            body: settings.value
        })
        await defaults.refresh()
        hints.addSuccess("Settings saved successfully.")
    }
    catch (error: any) {
        hints.addError(error.message, error)
    }
    finally {
        loading.value = false
    }
}

const section = cache.get<string>("settings.lastTab", () => "contact")
const tabs = ['about', 'contact', 'email', 'voting', 'moderation', 'feeds', 'topics', 'posts', 'links', 'threads', 'media', 'polls', 'misc']

const topicInput = useTemplateRef("topic")
function addTopic() {
    if (topicInput.value) {
        settings.value.topics.allowed.push(`topic:${topicInput.value.value}`)
        topicInput.value.value = ""
    }
}

async function addExistingTopics() {
    const topics = await useApi<{ id: string, score: number }[]>("/api/topic/available")
    settings.value.topics.allowed = topics.map(t => t.id)
}

function removeTopic(topic: string) {
    settings.value.topics.allowed = settings.value.topics.allowed.filter(t => t != topic)
}

const slowModeIntervalInput = ref<number>()
function addSlowModeInterval() {
    const interval = slowModeIntervalInput.value
    if (interval === undefined || !Number.isSafeInteger(interval) || interval <= 0) return
    if (settings.value.moderation.slowModes.includes(interval)) return

    settings.value.moderation.slowModes = [
        ...settings.value.moderation.slowModes,
        interval,
    ].sort((left, right) => left - right)
    slowModeIntervalInput.value = undefined
}

function removeSlowModeInterval(interval: number) {
    settings.value.moderation.slowModes = settings.value.moderation.slowModes
        .filter(value => value !== interval)
}

watch(() => settings.value.posts.enabled, (postsEnabled) => {
    if (!postsEnabled) {
        settings.value.feeds.posts = false
    }
})

watch(() => settings.value.links.enabled, (linksEnabled) => {
    if (!linksEnabled) {
        settings.value.feeds.links = false
    }
})

watch(() => settings.value.threads.enabled, (threadsEnabled) => {
    if (!threadsEnabled) {
        settings.value.feeds.threads = false
    }
})

watch(() => settings.value.media.images.enabled, (imagesEnabled) => {
    if (!imagesEnabled) {
        settings.value.feeds.images = false
    }
})

watch(() => settings.value.media.audio.enabled, (audioEnabled) => {
    if (!audioEnabled) {
        settings.value.feeds.audio = false
    }
})

watch(() => settings.value.media.video.enabled, (videoEnabled) => {
    if (!videoEnabled) {
        settings.value.feeds.video = false
    }
})

watch(() => settings.value.polls.enabled, (pollsEnabled) => {
    if (!pollsEnabled) {
        settings.value.feeds.polls = false
    }
})

</script>


<template>
    <article class="content-width column g-4 p-4">
        <header class="row wrap inline">
            <h1>Settings</h1>
        </header>
        <section class="box row g-6 p-5" aria-label="Settings editor">
            <nav class="tabs column g-2 pr-6" aria-label="Settings sections">
                <template v-for="tab in tabs">
                    <h3 class="clickable" :class="{ active: section == tab }" :aria-pressed="section == tab" @click="section = tab">
                        {{ tab }}
                    </h3>
                </template>
            </nav>
            <section class="column f-1" aria-label="Selected settings">
                <section v-if="section == 'about'" aria-label="About settings">
                    <div class="field">
                        <label>About summary</label>
                        <textarea rows="12" v-model="settings.about.summary"></textarea>
                    </div>
                </section>
                <section v-if="section == 'contact'" aria-label="Contact settings">
                    <div class="field">
                        <label>support email</label>
                        <input type="email" name="supportEmail" v-model="settings.email.support">
                    </div>
                    <div class="field">
                        <label>additional emails</label>
                        <textarea rows="2" v-model="settings.email.additional"></textarea>
                        <span class="tip">Multiple emails can be included, separated by ;</span>
                    </div>
                </section>
                <section v-if="section == 'email'" aria-label="Email settings">
                    <div class="field row">
                        <label class="f-1">daily email limit</label>
                        <input
                            class="py-1 px-2"
                            type="number"
                            min="1"
                            max="100000"
                            step="1"
                            v-model.number="settings.email.spool.dailyLimit"
                        >
                    </div>
                    <div class="field row">
                        <label class="f-1">batch limit</label>
                        <input
                            class="py-1 px-2"
                            type="number"
                            min="1"
                            max="1000"
                            step="1"
                            v-model.number="settings.email.spool.batchLimit"
                        >
                    </div>
                    <div class="field row">
                        <div class="column f-1">
                            <label>maximum retries</label>
                            <span class="tip">Retry count is in addition to the initial delivery attempt.</span>
                        </div>
                        <input
                            class="py-1 px-2"
                            type="number"
                            min="0"
                            max="10"
                            step="1"
                            v-model.number="settings.email.spool.maxRetries"
                        >
                    </div>
                </section>
                <section v-if="section == 'moderation'" aria-label="Moderation settings">
                    <div class="field row">
                        <label class="f-1">expected moderators per topic</label>
                        <input class="py-1 px-2" type="number" min="0" step="1" v-model="settings.moderation.perTopic">
                    </div>
                    <div class="field row">
                        <label class="f-1">moderation request threshold</label>
                        <input class="py-1 px-2" type="number" min="1" step="1" v-model="settings.moderation.threshold">
                    </div>
                    <div class="field">
                        <label>slow-mode intervals (seconds)</label>
                        <div class="row g-2">
                            <input
                                class="f-1"
                                type="number"
                                min="1"
                                step="1"
                                v-model.number="slowModeIntervalInput"
                                @keyup.enter="addSlowModeInterval"
                            >
                            <button class="small" @click="addSlowModeInterval">Add interval</button>
                        </div>
                        <div v-if="settings.moderation.slowModes.length" class="row wrap g-1 mt-2">
                            <template v-for="interval in settings.moderation.slowModes" :key="interval">
                                <Tag class="clickable" type="link" :label="`${interval}s`" @click="removeSlowModeInterval(interval)" />
                            </template>
                        </div>
                        <span class="tip">Moderators can apply one of these intervals to a discussion. Remove all values to disable slow-mode choices.</span>
                    </div>
                </section>
                <section v-if="section == 'voting'" aria-label="Voting settings">
                    <div class="field row">
                        <label class="f-1">enable voting</label>
                        <Toggle v-model:enabled="settings.voting.enabled" />
                    </div>
                    <div class="field row">
                        <label class="f-1">use misleading votes</label>
                        <Toggle 
                            :disabled="!settings.voting.enabled"
                            v-model:enabled="settings.voting.misleading"
                        />
                    </div>
                    <div class="field row">
                        <label class="f-1">use negative votes</label>
                        <Toggle
                            :disabled="!settings.voting.enabled"
                            v-model:enabled="settings.voting.negative"
                        />
                    </div>
                </section>
                <section v-if="section == 'feeds'" aria-label="Feed settings">
                    <div class="field row">
                        <label class="f-1">enable search</label>
                        <Toggle v-model:enabled="settings.feeds.search" />
                    </div>
                    <div class="field row">
                        <label class="f-1">show discover feed</label>
                        <Toggle
                            v-model:enabled="settings.feeds.discover"
                        />
                    </div>
                    <div class="field row">
                        <label class="f-1">show topics feed</label>
                        <Toggle 
                            v-model:enabled="settings.feeds.topics"
                        />
                    </div>
                    <div class="field row">
                        <label class="f-1">show posts feed</label>
                        <Toggle
                            :disabled="!settings.posts.enabled"
                            v-model:enabled="settings.feeds.posts"
                        />
                    </div>
                    <div class="field row">
                        <label class="f-1">show threads feed</label>
                        <Toggle
                            :disabled="!settings.threads.enabled"
                            v-model:enabled="settings.feeds.threads"
                        />
                    </div>
                    <div class="field row">
                        <label class="f-1">show links feed</label>
                        <Toggle
                            :disabled="!settings.links.enabled"
                            v-model:enabled="settings.feeds.links"
                        />
                    </div>
                    <div class="field row">
                        <label class="f-1">show images feed</label>
                        <Toggle
                            :disabled="!settings.media.images.enabled"
                            v-model:enabled="settings.feeds.images"
                        />
                    </div>
                    <div class="field row">
                        <label class="f-1">show audio feed</label>
                        <Toggle 
                            :disabled="!settings.media.audio.enabled"
                            v-model:enabled="settings.feeds.audio"
                        />
                    </div>
                    <div class="field row">
                        <label class="f-1">show video feed</label>
                        <Toggle
                            :disabled="!settings.media.video.enabled"
                            v-model:enabled="settings.feeds.video"
                        />
                    </div>
                    <div class="field row">
                        <label class="f-1">show polls feed</label>
                        <Toggle 
                            :disabled="!settings.polls.enabled"
                            v-model:enabled="settings.feeds.polls"
                        />
                        </div>
                </section>
                <section v-if="section == 'topics'" aria-label="Topic settings">
                    <div class="field row">
                        <label class="f-1">topics per submission</label>
                        <input
                            class="py-1 px-2"
                            type="number"
                            min="0" step="1" max="5"
                            v-model="settings.topics.perSubmission"
                        >
                    </div>
                    <div class="field row">
                        <label class="f-1">allowed topics only</label>
                        <Toggle v-model:enabled="settings.topics.restrict" />
                    </div>
                    <template v-if="settings.topics.restrict">
                        <div class="field row g-2">
                            <input class="f-1" ref="topic" placeholder="press enter to add . . ." @keyup.enter="addTopic">
                            <button class="small" @click="addExistingTopics">
                                Add Existing
                            </button>
                        </div>
                        <template v-if="settings.topics.allowed.length > 0">
                            <div class="field">
                                <div class="row wrap g-1">
                                    <template v-for="topic in settings.topics.allowed">
                                        <Tag class="f-1 b-half" type="link" :label="extractId(topic)" @click="removeTopic(topic)" />
                                    </template>
                                </div>
                            </div>
                        </template>
                    </template>
                </section>
                <section v-if="section == 'posts'" aria-label="Post settings">
                    <div class="field row">
                        <label class="f-1">enable posts</label>
                        <Toggle v-model:enabled="settings.posts.enabled" />
                    </div>
                </section>
                <section v-if="section == 'links'" aria-label="Link settings">
                    <p class="unavailable br-small row inline g-2 p-3 mb-3">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                        <span>Link publishing is unfinished. Enabling it exposes a preview-only editor.</span>
                    </p>
                    <div class="field row">
                        <label class="f-1">enable links</label>
                        <Toggle v-model:enabled="settings.links.enabled" />
                    </div>
                </section>
                <section v-if="section == 'threads'" aria-label="Thread settings">
                    <div class="field row">
                        <label class="f-1">enable threads</label>
                        <Toggle v-model:enabled="settings.threads.enabled" />
                    </div>
                    
                </section>
                <section v-if="section == 'media'" aria-label="Media settings">
                    <div class="field row">
                        <label class="f-1">use tokens</label>
                        <Toggle v-model:enabled="settings.media.tokens.enabled" />
                    </div>
                    <hr>
                    <div class="field row">
                        <label class="f-1">enable images</label>
                        <Toggle v-model:enabled="settings.media.images.enabled" />
                    </div>
                    
                    <div class="field row">
                        <label class="f-1">image upload limit (megabytes)</label>
                        <input
                            class="py-1 px-2"
                            type="number"
                            min="0" step="5" max="100"
                            :disabled="!settings.media.images.enabled"
                            v-model.number="settings.media.images.uploadLimit"
                        >
                    </div>
                    <hr>
                    <p class="unavailable br-small row inline g-2 p-3 mb-3">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                        <span>Audio and video publishing are unfinished. Enabling them exposes preview-only editors.</span>
                    </p>
                    <div class="field row">
                        <label class="f-1">enable audio</label>
                        <Toggle v-model:enabled="settings.media.audio.enabled" />
                    </div>
                    
                    <div class="field row">
                        <label class="f-1">audio upload limit (megabytes)</label>
                        <input
                            class="py-1 px-2"
                            type="number"
                            min="0" step="10" max="500"
                            :disabled="!settings.media.audio.enabled"
                            v-model.number="settings.media.audio.uploadLimit"
                        >
                    </div>
                    <div class="field row">
                        <label class="f-1">enable video</label>
                        <Toggle v-model:enabled="settings.media.video.enabled" />
                    </div>
                </section>
                <section v-if="section == 'polls'" aria-label="Poll settings">
                    <p class="unavailable br-small row inline g-2 p-3 mb-3">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                        <span>Poll publishing is unfinished. Enabling it exposes a preview-only editor.</span>
                    </p>
                    <div class="field row">
                        <label class="f-1">enable polls</label>
                        <Toggle v-model:enabled="settings.polls.enabled" />
                    </div>
                </section>
                <section v-if="section == 'misc'" aria-label="Feedback settings">
                    <div class="field row">
                        <label class="f-1">enable feedback</label>
                        <Toggle v-model:enabled="settings.misc.feedback.enabled" />
                    </div>
                    <div class="field row">
                        <label class="f-1">allow anonymous</label>
                        <Toggle 
                            :disabled="!settings.misc.feedback.enabled"
                            v-model:enabled="settings.misc.feedback.allowAnonymous"
                        />
                    </div>
                </section>
            </section>
        </section>
        <footer class="row g-2">
            <ButtonSpinner class="success f-1" :loading="loading" @click="saveSettings">
                <i class="fa-solid fa-floppy-disk"></i>
                <span>Save</span>
            </ButtonSpinner>
            <ButtonSpinner class="dark" :loading="resetting" @click="refreshSettings">
                <i class="fa-solid fa-rotate"></i>
                <span>Reset</span>
            </ButtonSpinner>
        </footer>
    </article>
</template>

<style scoped lang="scss">
nav.tabs {
    border-right: 2px solid $white-2;

    h3:hover, h3.active {
        color: $purple;
    }
}

div.field {
    margin-bottom: 0.75rem;

    label {
        margin-right: 1rem;
    }    
    input[type="number"] {
        width: stretch;
        max-width: 4rem;
        text-align: center;
    }
}
</style>