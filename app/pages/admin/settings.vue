<script setup lang="ts">
import type { ContentVisibilityTag } from "@@/shared/types"

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

const section = cache.get<string>("settings.lastTab", () => "about")
const tabs = ['feeds', 'voting', 'topics', 'moderation', 'discussion', 'media', 'content', 'email', 'feedback', 'about']

const existingTopics = await useDatasource<Topic[]>("/api/topic/available")
watch(() => settings.value.topics.restrict, (restrict) => {
    if (restrict && existingTopics.data.value) {
        settings.value.topics.allowed = existingTopics.data.value.map(t => t.id)
    }
})

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
    if (existingTopics.data.value?.some(t => t.id == topic)) return
    settings.value.topics.allowed = settings.value.topics.allowed.filter(t => t != topic)
}

const slowModeInput = ref<number>()
function addSlowModeInterval() {
    const interval = slowModeInput.value
    if (interval === undefined || !Number.isSafeInteger(interval) || interval <= 0) return
    if (settings.value.moderation.slowModes.includes(interval)) return

    settings.value.moderation.slowModes = [
        ...settings.value.moderation.slowModes,
        interval,
    ].sort((left, right) => left - right)
    slowModeInput.value = undefined
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

const tags = ref<{ value: ContentVisibilityTag; label: string; tip: string }[]>([
    { value: 'spoiler', label: 'Spoiler', tip: "Content that may spoil things." },
    { value: 'nsfw', label: 'NSFW', tip: "Not safe for work; or sexually explicit content." },
])

const visibilityOptions = ref([
    { value: 'show', label: 'Show' },
    { value: 'mask', label: 'Mask' },
    { value: 'filter', label: 'Hide' },
])

</script>


<template>
    <article class="settings-page content-width column g-4 p-4">
        <header class="row between inline">
            <h1>Settings</h1>
            <div class="row g-2">
                <ButtonSpinner class="success f-1" :loading="loading" @click="saveSettings">
                    <i class="fa-solid fa-floppy-disk"></i>
                    <span>Save</span>
                </ButtonSpinner>
                <ButtonSpinner class="dark" :loading="resetting" @click="refreshSettings">
                    <i class="fa-solid fa-rotate"></i>
                    <span>Cancel</span>
                </ButtonSpinner>
            </div>
        </header>
        <section class="settings-panel box row g-6 p-5">
            <nav class="tabs column g-2 pr-6">
                <template v-for="tab in tabs">
                    <h3 class="clickable" :class="{ active: section == tab }" @click="section = tab">
                        {{ tab }}
                    </h3>
                </template>
            </nav>
            <section class="settings-content column f-1 pr-3">
                <section v-if="section == 'feeds'">
                    <div class="field row">
                        <div class="column f-1">
                            <label>search</label>
                            <span class="tip">Allows users to find and search for content.</span>
                        </div>
                        <Toggle name="feeds.search" v-model:enabled="settings.feeds.search" />
                    </div>
                    <div class="field row">
                        <div class="column f-1">
                            <label>topics</label>
                            <span class="tip">Shows the available topics in a separate feed.</span>
                        </div>
                        <Toggle name="feeds.topics" v-model:enabled="settings.feeds.topics" />
                    </div>
                    <div class="field row">
                        <div class="column f-1">
                            <label>home</label>
                            <span class="tip">Aggregates all content into a single feed.</span>
                        </div>
                        <Toggle name="feeds.discover" v-model:enabled="settings.feeds.discover" />
                    </div>
                </section>
                <section v-if="section == 'voting'">
                    <div class="field row">
                        <div class="column f-1">
                            <label>enable voting</label>
                            <span class="tip">Allows users to vote on content.</span>
                        </div>
                        <Toggle name="voting.enabled" v-model:enabled="settings.voting.enabled" />
                    </div>
                    <div class="field row">
                        <div class="column f-1">
                            <label>misleading votes</label>
                            <span class="tip">Shows misleading vote option, marginally affects score.</span>
                        </div>
                        <Toggle name="voting.misleading"
                            :disabled="!settings.voting.enabled"
                            v-model:enabled="settings.voting.misleading"
                        />
                    </div>
                    <div class="field row">
                        <div class="column f-1">
                            <label>negative votes</label>
                            <span class="tip">Show negative vote option, negatively affects score.</span>
                        </div>
                        <Toggle name="voting.negative"
                            :disabled="!settings.voting.enabled"
                            v-model:enabled="settings.voting.negative"
                        />
                    </div>
                </section>
                <section v-if="section == 'topics'">
                    <div class="field row">
                        <div class="column f-1">
                            <label>topics per submission</label>
                            <span class="tip">The maximum number of allowed topics, between 1 and 5.</span>
                        </div>
                        <input class="py-1 px-2" type="number" name="topic.perSubmission" min="1" step="1" max="5" v-model="settings.topics.perSubmission">
                    </div>
                    <div class="field row">
                        <div class="column f-1">
                            <label>moderators per topic</label>
                            <span class="tip">Users may request moderation while the topic has fewer assigned moderators.</span>
                        </div>
                        <input class="py-1 px-2" type="number" name="moderation.perTopic" min="0" step="1" v-model="settings.moderation.perTopic">
                    </div>
                    <div class="field row">
                        <div class="column f-1">
                            <label>moderation request threshold</label>
                            <span class="tip">The number of approvals needed for a request.</span>
                        </div>
                        <input class="py-1 px-2" type="number" name="moderation.threshold" min="1" step="1" v-model="settings.moderation.threshold">
                    </div>
                    <div class="field row">
                        <div class="column f-1">
                            <label>restrict topics</label>
                            <span class="tip">Allows only established topics, can define topics if enabled.</span>
                        </div>
                        <Toggle name="topics.restrict" v-model:enabled="settings.topics.restrict" />
                    </div>
                    <template v-if="settings.topics.restrict">
                        <div class="field row g-2">
                            <button class="small" @click="addExistingTopics">
                                <i class="fa-solid fa-plus"></i>
                            </button>
                            <input class="f-1 px-2 py-1" name="topics.allowed" ref="topic" @keyup.enter="addTopic">
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
                <section v-if="section == 'moderation'">
                    <div class="field row">
                        <div class="column f-1">
                            <label>slow-mode intervals</label>
                            <span class="tip">The allowed intervals when enabling slow-mode (seconds).</span>
                            <div v-if="settings.moderation.slowModes.length" class="row wrap g-1 mt-2">
                                <template v-for="interval in settings.moderation.slowModes" :key="interval">
                                    <Tag class="clickable" type="link" :label="`${interval}s`" @click="removeSlowModeInterval(interval)" />
                                </template>
                            </div>
                        </div>
                        <div class="row g-2">
                            <input class="clean py-1 px-2" type="number" name="moderation.slowModes" min="1" v-model.number="slowModeInput" @keyup.enter="addSlowModeInterval">
                        </div>
                    </div>
                </section>
                <section v-if="section == 'discussion'">
                    <div class="field row">
                        <div class="column f-1">
                            <label>enable posts</label>
                            <span class="tip">Allow users to publish posts.</span>
                        </div>
                        <Toggle name="posts.enabled" v-model:enabled="settings.posts.enabled" />
                    </div>
                    <CollapseTransition>
                        <div v-if="settings.posts.enabled">
                            <div class="field row">
                                <div class="column f-1">
                                    <label>post feed</label>
                                    <span class="tip">Shows only posts in a separate feed.</span>
                                </div>
                                <Toggle name="feeds.posts" v-model:enabled="settings.feeds.posts" />
                            </div>
                        </div>
                    </CollapseTransition>
                    <hr>
                    <div class="field row">
                        <div class="column f-1">
                            <label>enable threads</label>
                            <span class="tip">Allow users to publish discussion threads.</span>
                        </div>
                        <Toggle name="threads.enabled" v-model:enabled="settings.threads.enabled" />
                    </div>
                    <CollapseTransition>
                        <div v-if="settings.threads.enabled">
                            <div class="field row">
                                <div class="column f-1">
                                    <label>thread feed</label>
                                    <span class="tip">Shows only threads in a separate feed.</span>
                                </div>
                                <Toggle name="feeds.threads" v-model:enabled="settings.feeds.threads" />
                            </div>
                        </div>
                    </CollapseTransition>
                    <hr>
                    <div class="field row">
                        <div class="column f-1">
                            <label>enable links</label>
                            <span class="tip">Allow users to publish links.</span>
                        </div>
                        <Toggle name="links.enabled" v-model:enabled="settings.links.enabled" />
                    </div>
                    <CollapseTransition>
                        <div v-if="settings.links.enabled">
                            <div class="field row">
                                <div class="column f-1">
                                    <label>link feed</label>
                                    <span class="tip">Shows only links in a separate feed.</span>
                                </div>
                                <Toggle name="feeds.links" v-model:enabled="settings.feeds.links" />
                            </div>
                        </div>
                    </CollapseTransition>
                    <hr>
                    <div class="field row">
                        <div class="column f-1">
                            <label>enable polls</label>
                            <span class="tip">Allow users to publish polls.</span>
                        </div>
                        <Toggle name="polls.enabled" v-model:enabled="settings.polls.enabled" />
                    </div>
                    <CollapseTransition>
                        <div v-if="settings.polls.enabled">
                            <p class="unavailable br-small row inline g-2 p-2 mb-3">
                                <i class="fa-solid fa-triangle-exclamation"></i>
                                <span>Poll publishing is unfinished and may be unstable.</span>
                            </p>
                            <div class="field row">
                                <div class="column f-1">
                                    <label>poll feed</label>
                                    <span class="tip">Show polls in the main content feed.</span>
                                </div>
                                <Toggle name="feeds.polls" v-model:enabled="settings.feeds.polls" />
                            </div>
                        </div>
                    </CollapseTransition>
                </section>
                <section v-if="section == 'media'">
                    <div class="field row">
                        <div class="column f-1">
                            <label>use tokens</label>
                            <span class="tip">Reserved for future media token support.</span>
                        </div>
                        <Toggle name="media.tokens.enabled" v-model:enabled="settings.media.tokens.enabled" />
                    </div>
                    <hr>
                    <div class="field row">
                        <div class="column f-1">
                            <label>enable image uploads</label>
                            <span class="tip">Allow users to upload images.</span>
                        </div>
                        <Toggle name="media.images.enabled" v-model:enabled="settings.media.images.enabled" />
                    </div>
                    <CollapseTransition>
                        <div v-if="settings.media.images.enabled">
                            <div class="field row">
                                <div class="column f-1">
                                    <label>image upload limit (megabytes)</label>
                                    <span class="tip">The maximum allowed size for each image upload.</span>
                                </div>
                                <input class="py-1 px-2" type="number" min="0" step="5" max="100" v-model.number="settings.media.images.uploadLimit">
                            </div>
                            <div class="field row">
                                <div class="column f-1">
                                    <label>post attachments</label>
                                    <span class="tip">Allow images to be attached to posts.</span>
                                </div>
                                <Toggle name="media.images.attachments.posts" v-model:enabled="settings.media.images.attachments.posts" />
                            </div>
                            <div class="field row">
                                <div class="column f-1">
                                    <label>thread attachments</label>
                                    <span class="tip">Allow images to be attached to threads.</span>
                                </div>
                                <Toggle name="media.images.attachments.threads" v-model:enabled="settings.media.images.attachments.threads" />
                            </div>
                            <div class="field row">
                                <div class="column f-1">
                                    <label>enable galleries</label>
                                    <span class="tip">Allow users to publish image galleries.</span>
                                </div>
                                <Toggle name="media.gallery.enabled" v-model:enabled="settings.media.gallery.enabled" />
                            </div>
                            <CollapseTransition>
                                <div v-if="settings.media.gallery.enabled">
                                    <div class="field row">
                                        <div class="column f-1">
                                            <label>gallery feed</label>
                                            <span class="tip">Show galleries in a separate feed.</span>
                                        </div>
                                        <Toggle name="feeds.images" v-model:enabled="settings.feeds.images" />
                                    </div>
                                </div>
                            </CollapseTransition>
                        </div>
                    </CollapseTransition>
                    <hr>
                    <div class="field row">
                        <div class="column f-1">
                            <label>enable audio</label>
                            <span class="tip">Allow users to publish audio.</span>
                        </div>
                        <Toggle name="media.audio.enabled" v-model:enabled="settings.media.audio.enabled" />
                    </div>
                    <CollapseTransition>
                        <div v-if="settings.media.audio.enabled">
                            <p class="unavailable br-small row inline g-2 p-2 mb-3">
                                <i class="fa-solid fa-triangle-exclamation"></i>
                                <span>Audio publishing is unfinished and may be unstable.</span>
                            </p>
                            <div class="field row">
                                <div class="column f-1">
                                    <label>audio upload limit (megabytes)</label>
                                    <span class="tip">The maximum allowed size for each audio upload.</span>
                                </div>
                                <input class="py-1 px-2" type="number" name="media.audio.uploadLimit" min="0" step="10" max="500" v-model.number="settings.media.audio.uploadLimit">
                            </div>
                            <div class="field row">
                                <div class="column f-1">
                                    <label>audio</label>
                                    <span class="tip">Shows only audio in a separate feed.</span>
                                </div>
                                <Toggle name="feeds.audio" v-model:enabled="settings.feeds.audio" />
                            </div>
                        </div>
                    </CollapseTransition>
                    <hr>
                    <div class="field row">
                        <div class="column f-1">
                            <label>enable video</label>
                            <span class="tip">Allow users to publish video.</span>
                        </div>
                        <Toggle name="media.video.enabled" v-model:enabled="settings.media.video.enabled" />
                    </div>
                    <CollapseTransition>
                        <div v-if="settings.media.video.enabled">
                            <p class="unavailable br-small row inline g-2 p-2 mb-3">
                                <i class="fa-solid fa-triangle-exclamation"></i>
                                <span>Video publishing is unfinished and may be unstable.</span>
                            </p>
                            <div class="field row">
                                <div class="column f-1">
                                    <label>video</label>
                                    <span class="tip">Shows only video in a separate feed.</span>
                                </div>
                                <Toggle name="feeds.video" v-model:enabled="settings.feeds.video" />
                            </div>
                        </div>
                    </CollapseTransition>
                </section>
                <section v-if="section == 'content'">
                    <div v-for="tag in tags" :key="tag.value" class="field row">
                        <div class="column f-1">
                            <label>{{ tag.label }}</label>
                            <span class="tip">{{ tag.tip ?? "" }}</span>
                        </div>
                        <select class="px-2 py-1" :name="`content.visibility.${tag.value}`" v-model="settings.content.visibility[tag.value]">
                            <option v-for="mode in visibilityOptions" :key="mode.value" :value="mode.value">
                                {{ mode.label }}
                            </option>
                        </select>
                    </div>
                </section>
                <section v-if="section == 'email'">
                    <div class="field">
                        <label>support email</label>
                        <input type="email" name="email.support" v-model="settings.email.support">
                    </div>
                    <div class="field">
                        <label>additional emails</label>
                        <textarea rows="2" name="email.additional" v-model="settings.email.additional"></textarea>
                        <span class="tip">Multiple emails can be included, separated by ;</span>
                    </div>
                    <hr>
                    <div class="field row">
                        <div class="column f-1">
                            <label>daily email limit</label>
                            <span class="tip">A daily limit for the total number of emails that can be sent.</span>
                        </div>
                        <input class="py-1 px-2" type="number" name="email.spool.dailyLimit" min="1" max="100000" step="100" v-model.number="settings.email.spool.dailyLimit">
                    </div>
                    <div class="field row">
                        <div class="column f-1">
                            <label>batch limit</label>
                            <span class="tip">The maximum number of email per batch.</span>
                        </div>
                        <input class="py-1 px-2" type="number" name="email.spool.batchLimit" min="1" max="1000" step="10" v-model.number="settings.email.spool.batchLimit">
                    </div>
                    <div class="field row">
                        <div class="column f-1">
                            <label>maximum retries</label>
                            <span class="tip">Retry count is in addition to the initial delivery attempt.</span>
                        </div>
                        <input class="py-1 px-2" type="number" name="email.spool.maxRetries" min="0" max="10" step="1" v-model.number="settings.email.spool.maxRetries">
                    </div>
                </section>
                <section v-if="section == 'feedback'">
                    <div class="field row">
                        <div class="column f-1">
                            <label>enable feedback</label>
                            <span class="tip">Allow users to send feedback to site administrators.</span>
                        </div>
                        <Toggle name="misc.feedback.enabled" v-model:enabled="settings.misc.feedback.enabled" />
                    </div>
                    <div class="field row">
                        <div class="column f-1">
                            <label>allow anonymous</label>
                            <span class="tip">Allow feedback submissions without an authenticated account.</span>
                        </div>
                        <Toggle name="misc.feedback.allowAnonymous" :disabled="!settings.misc.feedback.enabled" v-model:enabled="settings.misc.feedback.allowAnonymous" />
                    </div>
                </section>
                <section v-if="section == 'about'">
                    <MarkdownEditor
                        label="app summary"
                        tip="Displayed on the about page to tell users about this site."
                        :rows="12"
                        v-model="settings.about.summary"
                    />
                </section>
            </section>
        </section>
    </article>
</template>

<style scoped lang="scss">
article.settings-page {
    height: 100%;
    min-height: 0;
    overflow: hidden;
    box-sizing: border-box;
}

section.settings-panel {
    flex: 1 1 auto;
    min-height: 0;
    overflow: hidden;
}

section.settings-content {
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior-y: contain;
}

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
    select {
        width: 8rem;
        text-align: center;
    }
}

p.unavailable {
    font-size: 0.8rem;
}
</style>