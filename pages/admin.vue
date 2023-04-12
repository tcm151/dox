<script setup lang="ts">
import { storeToRefs } from 'pinia';

definePageMeta({
    layout: 'minimal'
})

let showSettings = ref(false)

const { settings, history, saved } = storeToRefs(useQuery())

let tab = ref<string>("History")
let query = ref<string>("");
let results = ref<any>(null);

function reuseQuery (oldQuery: string) {
    query.value = oldQuery
}

function saveQuery(savedQuery: string) {
    saved.value.unshift(savedQuery)
}

function removeQueryFromHistory(oldQuery: string) {
    history.value = history.value.filter(h => h !== oldQuery)
}

function removeQueryFromSaved(savedQuery: string) {
    saved.value = saved.value.filter(s => s !== savedQuery)
}

async function submitQuery () {
    const response = await fetch(`${settings.value.host}/sql`, {
        method: "POST",
        headers: {
            "Content-Type": "text",
            "Accept": "application/json",
            "NS": settings.value.namespace,
            "DB": settings.value.database,
            "Authorization": `Basic ${btoa(`${settings.value.username}:${settings.value.password}`)}`
        },
        body: query.value
    });

    if (response.ok) {
        history.value = history.value.filter(q => q !== query.value);
        history.value.unshift(query.value);
        results.value = await response.json();
        tab.value = 'Results'
    } else {
        const json = await response.json();
        alert(json.information);
    }
}
</script>

<template>
    <article class="row g-2 m-4">
        <QuerySettings :visible="showSettings" @close="showSettings = false" />
        <div class="left column g-2 p-4">
            <section class="editor fill column g-2">
                <header class="row g-2">
                    <button class="danger" @click="query = ''">
                        Clear
                    </button>
                    <button class="success fill" @click="submitQuery">
                        Submit
                    </button>
                </header>
                <div class="field fill">
                    <textarea rows="16" spellcheck="false" v-model="query" />
                </div>
            </section>
        </div>
        <div class="right column g-2 p-4">
            <header class="row g-2">
                <button class="link fill" @click="tab = 'Results'">
                    Results
                </button>
                <button class="link fill" @click="tab = 'History'">
                    History
                </button>
                <button class="link fill" @click="tab = 'Saved'">
                    Saved
                </button>
                <button class="link fill" @click="showSettings = true">
                    Settings
                </button>
            </header>
            <section class="results column g-2" v-if="tab == 'Results'">
                <div class="result column g-2" v-for="result in results">
                    <code class="p-4">{{ result.result }}</code>
                </div>
            </section>
            <section class="history column g-2" v-if="tab == 'History'">
                <div class="query" v-for="(query, index) in history" :key="index">
                    <p class="p-2">{{ query }}</p>
                    <div class="buttons row g-1">
                        <button @click="reuseQuery(query)">
                            <i class="fa-solid fa-rotate-right"></i>
                        </button>
                        <button @click="saveQuery(query)">
                            <i class="fa-solid fa-floppy-disk"></i>
                        </button>
                        <button @click="removeQueryFromHistory(query)">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </div>
            </section>
            <section class="saved column g-2" v-if="tab == 'Saved'">
                <div class="query" v-for="(query, index) in saved" :key="index">
                    <p class="p-2">{{ query }}</p>
                    <div class="buttons row g-1">
                        <button @click="reuseQuery(query)">
                            <i class="fa-solid fa-rotate-right"></i>
                        </button>
                        <button @click="removeQueryFromSaved(query)">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </div>
            </section>
        </div>
        <QuerySettings :visible="showSettings" @close="showSettings = false" />
    </article>
</template>

<style scoped lang="scss">
article {
    height: 100%;
    @include fit-width (2000px, 1rem);
    overflow: hidden;

    div.left, div.right {
        flex: 1 1;
        border-radius: 0.25rem;
        background-color: $dox-white-ultra;
    }
}

section.editor {
    header.row {
        justify-content: flex-end;
    }

    textarea {
        height: 100%;
        resize: none;
        font-weight: 500;
        font-family: "Roboto Mono", monospace;
    }
}



section.history, section.saved {
    overflow-y: auto;

    div.query {
        position: relative;
        
        p {
            white-space: pre-wrap;
            font-weight: 500;
            font-family: "Roboto Mono", monospace;
            border-radius: 0.25rem;
            background-color: $dox-white-light;
        }

        div.buttons {
            top: 0;
            right: 0;
            position: absolute;
        }
    }

    button {
        padding: 0.25rem 0.5rem;
    }
}

div.right {
    overflow: hidden;
}

section.results {
    overflow: hidden;

    div.result {
        overflow-y: auto;
        overflow-x: hidden;
    }

    code {
        overflow-x: hidden;
        white-space: pre-wrap;
        font-weight: 500;
        font-family: "Roboto Mono", monospace;
        background-color: $dox-white-light !important;
    }
}
</style>
