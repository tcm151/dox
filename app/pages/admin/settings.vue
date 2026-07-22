<script setup lang="ts">

const hints = useHints()
const cache = useCache()
const defaults = useSettings()
const settings = ref({ ...defaults.app })

async function refreshSettings() {
    await defaults.refresh()
    settings.value = { ...defaults.app }
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
        hints.addError(error.message)
    }
    finally {
        loading.value = false
    }
}

const section = cache.get<string>("settings.lastTab", () => "contact")
const tabs = ['contact', 'voting', 'moderation', 'feeds', 'topics', 'posts', 'links', 'threads', 'media', 'polls', 'misc']

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

watch(() => settings.value.posts.enabled, (postsEnabled) => {
    if (!postsEnabled) {
        settings.value.feeds.posts = false
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

</script>


<template>
    <article class="column g-4 m-4">
        <div class="box row g-6 p-5">
            <aside class="tabs column g-2 pr-6">
                <template v-for="tab in tabs">
                    <h3 :class="{ active: section == tab }" @click="section = tab">
                        {{ tab }}
                    </h3>    
                </template>
            </aside>
            <section class="column f-1">
                <div v-if="section == 'contact'">
                    <div class="field">
                        <label>support email</label>
                        <input type="email" name="supportEmail" v-model="settings.email.support">
                    </div>
                    <div class="field">
                        <label>additional emails</label>
                        <textarea rows="2" v-model="settings.email.additional"></textarea>
                        <span class="tip">Multiple emails can be included, separated by ;</span>
                    </div>
                </div>
                <div v-if="section == 'moderation'">
                    <div class="field row">
                        <label class="f-1">expected moderators per topic</label>
                        <input type="number" v-model="settings.moderation.perTopic">
                    </div>
                    <div class="field row">
                        <label class="f-1">moderation request threshold</label>
                        <input type="number" v-model="settings.moderation.threshold">
                    </div>
                </div>
                <div v-if="section == 'voting'">
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
                </div>
                <div v-if="section == 'feeds'">
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
                </div>
                <div v-if="section == 'topics'">
                    <div class="field row">
                        <label class="f-1">topics per submission</label>
                        <input
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
                </div>
                <div v-if="section == 'posts'">
                    <div class="field row">
                        <label class="f-1">enable posts</label>
                        <Toggle v-model:enabled="settings.posts.enabled" />
                    </div>
                </div>
                <div v-if="section == 'links'">
                    <div class="field row">
                        <label class="f-1">enable links</label>
                        <Toggle v-model:enabled="settings.links.enabled" />
                    </div>
                </div>
                <div v-if="section == 'threads'">
                    <div class="field row">
                        <label class="f-1">enable threads</label>
                        <Toggle v-model:enabled="settings.threads.enabled" />
                    </div>
                    
                </div>
                <div v-if="section == 'media'">
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
                            type="number"
                            min="0" step="5" max="100"
                            :disabled="!settings.media.images.enabled"
                            v-model.number="settings.media.images.uploadLimit"
                        >
                    </div>
                    <hr>
                    <div class="field row">
                        <label class="f-1">enable audio</label>
                        <Toggle v-model:enabled="settings.media.audio.enabled" />
                    </div>
                    
                    <div class="field row">
                        <label class="f-1">audio upload limit (megabytes)</label>
                        <input
                            type="number"
                            min="0" step="10" max="500"
                            :disabled="!settings.media.audio.enabled"
                            v-model.number="settings.media.audio.uploadLimit"
                        >
                    </div>
                </div>
                <div v-if="section == 'polls'">
                    <div class="field row">
                        <label class="f-1">enable polls</label>
                        <Toggle v-model:enabled="settings.polls.enabled" />
                    </div>
                </div>
                <div v-if="section == 'misc'">
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
                </div>
            </section>
        </div>
        <footer class="row g-2">
            <ButtonSpinner class="success f-1" :loading="loading" @click="saveSettings">
                <i class="fa-solid fa-floppy-disk"></i>
                <span>Save</span>
            </ButtonSpinner>
            <button class="dark" @click="refreshSettings">
                <i class="fa-solid fa-rotate"></i>
                <span>Reset</span>
            </button>
        </footer>
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width(50rem, 1rem);
}

aside.tabs {
    border-right: 2px solid $white-2;

    h3:hover, h3.active {
        cursor: pointer;
        color: $purple;
    }
}

div.field {
    margin-bottom: 0.75rem;

    label {
        margin-right: 1rem;
    }    
    input[type="number"] {
        padding: 0.25rem 0.5rem;
        width: stretch;
        max-width: 4rem;
        text-align: center;
    }
}
</style>