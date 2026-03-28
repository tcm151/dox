<script setup lang="ts">

const hints = useHints()
const cache = useCache()
const defaults = useSettings()
const settings = ref(defaults.app)

async function refreshSettings() {
    await defaults.refresh()
    settings.value = defaults.app
}

const loading = ref<boolean>(false)
async function saveSettings() {
    try {
        loading.value = true
        await useApi(`/api/admin/config/${defaults.app.id}/update`, {
            body: {
                config: settings.value
            }
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
const tabs = ['contact', 'voting', 'topics', 'posts', 'threads', 'images', 'audio', 'misc']


const allowedTopicsOnly = ref<boolean>(false)
const topicInput = useTemplateRef("topic")
const allowedTopics = ref<string[]>([])
function addTopic() {
    if (topicInput.value) {
        allowedTopics.value.push(`topic:${topicInput.value.value}`)
        topicInput.value.value = ""
    }
}

async function addExistingTopics() {
    const topics = await useApi<{ id: string, score: number }[]>("/api/topic/available")
    allowedTopics.value = topics.map(t => t.id)
}

function removeTopic(topic: string) {
    allowedTopics.value = allowedTopics.value.filter(t => t != topic)
}

// TODO make all of the settings here actually functional
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
                        <textarea rows="2"></textarea>
                        <span class="tip">Multiple emails can be included, separated by ;</span>
                    </div>
                </div>
                <div v-if="section == 'voting'">
                    <div class="field row">
                        <label class="f-1">enable misleading votes</label>
                        <Toggle v-model:enabled="settings.voting.showMisleading" />
                    </div>
                    <div class="field row">
                        <label class="f-1">enable negative votes</label>
                        <Toggle v-model:enabled="settings.voting.showNegative" />
                    </div>
                </div>
                <div v-if="section == 'topics'">
                    <div class="field row">
                        <label class="f-1">enable topics</label>
                        <Toggle :enabled="true" disabled />
                    </div>
                    <div class="field row">
                        <label class="f-1">topics per submission</label>
                        <input
                            type="number"
                            min="0" step="1" max="5"
                            value="3"
                        >
                    </div>
                    <div class="field row">
                        <label class="f-1">show topic feed</label>
                        <Toggle v-model:enabled="settings.feed.showTopics" />
                    </div>
                    <div class="field row">
                        <label class="f-1">allowed topics only</label>
                        <Toggle v-model:enabled="allowedTopicsOnly" />
                    </div>
                    <template v-if="allowedTopicsOnly">
                        <div class="field row g-2">
                            <input class="f-1" ref="topic" placeholder="press enter to add . . ." @keyup.enter="addTopic">
                            <button class="small" @click="addExistingTopics">
                                Add Existing
                            </button>
                        </div>
                        <template v-if="allowedTopics.length > 0">
                            <div class="field">
                                <div class="row wrap g-1">
                                    <template v-for="topic in allowedTopics">
                                        <Tag class="f-1 s-1 b-half" type="link" :label="extractId(topic)" @click="removeTopic(topic)" />
                                    </template>
                                </div>
                            </div>
                        </template>
                    </template>
                </div>
                <div v-if="section == 'posts'">
                    <div class="field row">
                        <label class="f-1">enable posts</label>
                        <Toggle :enabled="true" disabled />
                    </div>
                </div>
                <div v-if="section == 'threads'">
                    <div class="field row">
                        <label class="f-1">enable threads</label>
                        <Toggle :enabled="true" disabled />
                    </div>
                    <div class="field row">
                        <label class="f-1">show threads feed</label>
                        <Toggle v-model:enabled="settings.feed.showThreads" />
                    </div>
                </div>
                <div v-if="section == 'images'">
                    <div class="field row">
                        <label class="f-1">enable images</label>
                        <Toggle v-model:enabled="settings.media.uploads.enabled" />
                    </div>
                    <div class="field row">
                        <label class="f-1">show images feed</label>
                        <Toggle v-model:enabled="settings.feed.showImages" />
                    </div>
                    <div class="field row">
                        <label class="f-1">image upload limit (megabytes)</label>
                        <input
                            type="number"
                            min="0" step="5" max="100"
                            :disabled="!settings.media.uploads.enabled"
                            v-model.number="settings.media.uploads.imageMaxSize"
                        >
                    </div>
                </div>
                <div v-if="section == 'audio'">
                    <div class="field row">
                        <label class="f-1">enable audio</label>
                        <Toggle v-model:enabled="settings.media.uploads.enabled" disabled />
                    </div>
                    <div class="field row">
                        <label class="f-1">show audio feed</label>
                        <Toggle :enabled="false" disabled />
                    </div>
                    <div class="field row">
                        <label class="f-1">audio upload limit (megabytes)</label>
                        <input
                            type="number"
                            min="0" step="10" max="500"
                            :disabled="!settings.media.uploads.enabled"
                            v-model.number="settings.media.uploads.audioMaxSize"
                        >
                    </div>
                </div>
                <div v-if="section == 'misc'">
                    <div class="field row">
                        <label class="f-1">enable search</label>
                        <Toggle v-model:enabled="settings.feed.showSearch" />
                    </div>
                    <div class="field row">
                        <label class="f-1">enable feedback</label>
                        <Toggle v-model:enabled="settings.navbar.showFeedback" />
                    </div>
                    <div class="field row">
                        <label class="f-1">enable store</label>
                        <Toggle v-model:enabled="settings.navbar.showStore" />
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
    margin-bottom: 0.5rem;

    label {
        margin-right: 1rem;
    }    
    input, textarea {
        font-size: 0.8rem;
    }
    input[type="number"] {
        padding: 0.25rem 0.5rem;
        width: stretch;
        max-width: 4rem;
        text-align: center;
    }
}
</style>