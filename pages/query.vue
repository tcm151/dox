<script setup lang="ts">
import { storeToRefs } from 'pinia';

definePageMeta({
    layout: 'simple',
    middleware: (to, from) => {
        if (process.client) {
            const session = getSession()
            if (to.path === "/query" && !session.isAuthenticated) {
                return navigateTo("/")
            }
        }
    }
})

const hints = useHints()
const { settings, history, saved } = storeToRefs(useQuery())

let tab = ref<string>("History")
let results = ref<any>(null);
let query = useSessionStorage<string>("query", "");
let showSettings = ref(false)

function reuseQuery (oldQuery: string) {
    query.value = oldQuery
}

// function saveQuery(savedQuery: string) {
//     saved.value.unshift(savedQuery)
//     hints.addSuccess("Query saved")
// }

function exportSavedQueries() {
    console.log(saved.value)
}

function removeQueryFromHistory(oldQuery: string) {
    history.value = history.value.filter(h => h !== oldQuery)
    hints.addWarning("Query removed from history")
}

// function removeQueryFromSaved(savedQuery: string) {
//     saved.value = saved.value.filter(s => s !== savedQuery)
//     hints.addWarning("Query removed from saved")
// }

// function moveSavedQueryUp(savedQuery: string) {
//     const index = saved.value.findIndex(sq => sq === savedQuery)
//     saved.value.splice(index, 1)
//     saved.value.splice(index - 1, 0, savedQuery)
// }

// function moveSavedQueryDown(savedQuery: string) {
//     const index = saved.value.findIndex(sq => sq === savedQuery)
//     saved.value.splice(index, 1)
//     saved.value.splice(index + 1, 0, savedQuery)
// }

let queryDirectory = ref<any[]>([])
let grabbedQuery = ref<string>('')

function saveQuery(event: DragEvent, folder: any) {
    if (grabbedQuery.value != '') {
        queryDirectory.value.push({
            type: 'file',
            name: '',
            parent: folder.name,
            query: grabbedQuery.value,
            editing: true,
        })
        grabbedQuery.value = ''
    }
}

async function submitQuery() {
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
        results.value.forEach((r: any) => {
            hints.addSuccess(r.time)
        })
        tab.value = 'Results'
    } else {
        const json = await response.json();
        hints.addError(json.information)
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
                        <span>Clear</span>
                        <i class="fa-solid fa-soap"></i>
                    </button>
                    <button class="success fill" @click="submitQuery">
                        <span>Submit</span>
                        <i class="fa-solid fa-paper-plane"></i>
                    </button>
                </header>
                <div class="field">
                    <textarea rows="16" spellcheck="false" @keydown.enter.alt.prevent="submitQuery" v-model="query" />
                </div>
                <div class="saved-query-directory">
                    <Directory root="queries" :buttons="['add-folder']" @select-item="(item) => reuseQuery(item.query)" @add-item="saveQuery" :items="queryDirectory" />
                </div>
            </section>
        </div>
        <div class="right column g-2 p-4">
            <header class="row g-2">
                <button class="link fill" @click="tab = 'Results'">
                    <i class="fa-solid fa-square-poll-horizontal"></i>
                    <span>Results</span>
                </button>
                <button class="link fill" @click="tab = 'History'">
                    <i class="fa-solid fa-book"></i>
                    <span>History</span>
                </button>
                <!-- <button class="link fill" @click="tab = 'Saved'">
                    <i class="fa-solid fa-floppy-disk"></i>
                    <span>Saved</span>
                </button> -->
                <button class="link fit" @click="exportSavedQueries">
                    <i class="fa-solid fa-download"></i>
                </button>
                <button class="link fit" @click="showSettings = true">
                    <i class="fa-solid fa-gear"></i>
                </button>
            </header>
            <section class="results column g-2" v-if="tab == 'Results'">
                <div class="result column g-2" v-for="result in results">
                    <code class="p-4">{{ result.result }}</code>
                </div>
            </section>
            <section class="history column g-2" v-if="tab == 'History'">
                <div class="query" v-for="(query, index) in history" :key="index" draggable="true" @dragstart="grabbedQuery = query">
                    <p class="p-2">{{ query }}</p>
                    <div class="buttons row g-2">
                        <button @click="reuseQuery(query)">
                            <i class="fa-solid fa-rotate"></i>
                        </button>
                        <!-- <button @click="saveQuery(query)">
                            <i class="fa-solid fa-floppy-disk"></i>
                        </button> -->
                        <button @click="removeQueryFromHistory(query)">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </div>
            </section>
            <!-- <section class="saved column g-2" v-if="tab == 'Saved'">
                <div class="query" v-for="(query, index) in saved" :key="index">
                    <p class="p-2">{{ query }}</p>
                    <div class="buttons row g-2">
                        <button @click="reuseQuery(query)">
                            <i class="fa-solid fa-rotate"></i>
                        </button>
                        <button @click="moveSavedQueryUp(query)">
                            <i class="fa-solid fa-up-long"></i>
                        </button>
                        <button @click="moveSavedQueryDown(query)">
                            <i class="fa-solid fa-down-long"></i>
                        </button>
                        <button @click="removeQueryFromSaved(query)">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </div>
            </section> -->
        </div>
        <QuerySettings :visible="showSettings" @close="showSettings = false" />
    </article>
</template>

<style scoped lang="scss">
article {
    height: 100%;
    @include fit-width (2000px, 1rem);
    overflow: hidden;

    div.left { flex: 1 1 40% }
    div.right { flex: 1 1 60% }

    div.left, div.right {
        border-radius: 0.25rem;
        background-color: $dox-white-ultra;
    }
}

.row {
    button:has(i, span) {
        @include flex-h (0.5rem);
        justify-content: center;
        align-items: center;
    }
}

section.editor {
    header.row {
        justify-content: flex-end;
    }

    div:has(textarea), div.saved-query-directory {
        flex: 1 1;
    }

    textarea {
        height: 100%;
        resize: none;
        font-weight: 500;
        font-family: "Source Code Pro", monospace;
    }
}

section.history, section.saved {
    overflow-y: auto;

    div.query {
        position: relative;
        
        p {
            white-space: pre-wrap;
            font-weight: 500;
            font-family: "Source Code Pro", monospace;
            border-radius: 0.25rem;
            background-color: $dox-white-light;
        }

        div.buttons {
            top: 0;
            right: 0;
            position: absolute;
            padding: 0.5rem;

            button {
                padding: 0;
                font-size: 1.2rem;
                background-color: transparent;
            }

            button:hover {
                color: $dox-white;
            }
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
    overflow-y: auto;

    code {
        overflow-x: hidden;
        overflow-y: visible;
        white-space: pre-wrap;
        font-weight: 500;
        font-family: "Source Code Pro", monospace;
        background-color: $dox-white-light !important;
    }
}
</style>
