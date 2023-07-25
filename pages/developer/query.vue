<script setup lang="ts">
import { storeToRefs } from 'pinia';

const hints = useHints()
const { settings, history, saved } = storeToRefs(useQuery())

let tab = ref<string>("History")
let results = ref<any[]>([]);
let query = useSessionStorage<string>("query", "");
let showSettings = ref(false)

const showSearch = useSessionStorage("showQueryHistorySearch", false)
const searchBar = ref("");

function filteredHistory(): any[] {
    if (searchBar.value !== '') {
        const rankings = history.value.map(query => {
            const tokens = searchBar.value.split(/\s/)
            let relevance = tokens.map(t => query.toLowerCase().includes(t.toLowerCase()) ? 1 : -5).reduce((a, b) => a + b, 0)
            relevance += query.toLowerCase().includes(searchBar.value.toLowerCase()) ? 25 : -1
            return { query, relevance }
        })
        const matches = rankings.filter(r => r.relevance > 0)
        const sorted = matches.sort((a, b) => b.relevance - a.relevance)
        return sorted.map(s => s.query)
    }
    else {
        return history.value
    }
}

function clearHistory() {

}

function reuseQuery (oldQuery: string) {
    query.value = oldQuery
}    

function removeQueryFromHistory(oldQuery: string) {
    history.value = history.value.filter(h => h !== oldQuery)
    hints.addWarning("Query removed from history")
}

let grabbedQuery = ref<string>('')

function saveQuery(event: DragEvent, folder: any) {
    if (grabbedQuery.value != '') {
        saved.value.push({
            type: 'file',
            name: '',
            parent: folder.name,
            query: grabbedQuery.value,
            editing: true,
        })
        grabbedQuery.value = ''
    }
}

function removeQueryFromSaved(item: any) {
    saved.value = saved.value.filter(s => s !== item)
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
        <ClientOnly>
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
                        <Directory
                            root="Queries"
                            :buttons="['add-folder']"
                            @add-item="saveQuery"
                            @select-item="(item) => reuseQuery(item.query)"
                            @remove-item="(item) => removeQueryFromSaved(item)"
                            :items="saved"
                        />
                    </div>
                </section>
            </div>
            <div class="right column g-2 p-4">
                <header class="column g-2">
                    <div class="row g-2">
                        <button class="link fit" @click="showSearch = !showSearch">
                            <i class="fa-solid fa-magnifying-glass"></i>
                        </button>
                        <button class="link fill" @click="tab = 'Results'">
                            <i class="fa-solid fa-square-poll-horizontal"></i>
                            <span>Results</span>
                        </button>
                        <button class="link fill" @click="tab = 'History'">
                            <i class="fa-solid fa-book"></i>
                            <span>History</span>
                        </button>
                        <button class="link fit" @click="clearHistory">
                            <i class="fa-solid fa-broom"></i>
                        </button>
                        <button class="link fit" @click="showSettings = true">
                            <i class="fa-solid fa-gear"></i>
                        </button>
                    </div>
                    <div class="field" v-if="showSearch">
                        <input type="search" v-model="searchBar">
                    </div>
                </header>
                <section class="results column g-2" v-if="tab == 'Results'">
                    <div class="result column g-2" v-for="result in results">
                        <code class="p-4">{{ result.result }}</code>
                    </div>
                </section>
                <section class="history column g-2" v-if="tab == 'History'">
                    <div class="query" v-for="(item, index) in filteredHistory()" :key="index" draggable="true" @dragstart="grabbedQuery = item">
                        <p class="p-2">{{ item }}</p>
                        <div class="buttons row g-2">
                            <button @click="reuseQuery(item)">
                                <i class="fa-solid fa-rotate"></i>
                            </button>
                            <button @click="removeQueryFromHistory(item)">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </div>
                    </div>
                </section>
            </div>
        </ClientOnly>
    </article>
</template>

<style scoped lang="scss">

input[type=search]::-webkit-search-cancel-button:hover {
    cursor: pointer;
}

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