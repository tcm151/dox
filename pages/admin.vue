<script setup lang="ts">
definePageMeta({
    layout: 'minimal'
})

interface Settings {
    host: string,
    username: string,
    password: string,
    namespace: string,
    database: string,
}

const settings = useLocalStorage<Settings>("settings", {
    host: "",
    username: "",
    password: "",
    namespace: "",
    database: ""
})

const queryHistory = useLocalStorage<string[]>("history", [])
const savedQueries = useLocalStorage<string[]>("saved", [])

let query = useSessionStorage<string>("query", "");

interface QueryResult {

}

let tab = useLocalStorage<string>("tab", "History")
let results = ref<any>();

const selectTab = (t: string) => {
    tab.value = t;
    localStorage.setItem("tab", t);
}

function reuseQuery (oldQuery: string) {
    query.value = oldQuery
}

function saveQuery(savedQuery: string) {
    savedQueries.value.push(savedQuery)
}

function removeQueryFromHistory(oldQuery: string) {
    queryHistory.value = queryHistory.value.filter(h => h !== oldQuery)
}

function removeQueryFromSaved(savedQuery: string) {
    savedQueries.value = savedQueries.value.filter(s => s !== savedQuery)
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
        queryHistory.value = queryHistory.value.filter(q => q !== query.value);
        queryHistory.value.unshift(query.value);
        localStorage.setItem("queryHistory", JSON.stringify(queryHistory.value));
        results.value = await response.json();
        document.getElementById('query-history')!.scrollTo(0, 0);
    } else {
        const json = await response.json();
        alert(json.information);
    }
}

function indent(event: KeyboardEvent) {
    event.preventDefault()
    const textArea = (event.target as HTMLTextAreaElement)
    const cursorPosition = textArea.selectionStart
    query.value = query.value.slice(0, textArea.selectionStart) + "    " + query.value.slice(textArea.selectionStart)
    console.log(cursorPosition)
    textArea.focus()
    textArea.setSelectionRange(0, 0)
}
</script>

<template>
    <article class="row g-4 p-4">
        <div class="left column g-4">
            <section class="editor column g-2 p-5">
                <div class="field">
                    <textarea rows="16" spellcheck="false" @keydown.tab="indent" v-model="query" />
                </div>
                <footer class="row g-2">
                    <button @click="submitQuery">Submit</button>
                    <button @click="query = ''">Clear</button>
                    <button @click="selectTab('Settings')">Settings</button>
                    <button @click="selectTab('History')">History</button>
                    <button @click="selectTab('Saved')">Saved</button>
                </footer>
            </section>
            <section class="settings column g-2 p-5" v-if="tab == 'Settings'">
                <div class="field">
                    <label>Host</label>
                    <input type="text" v-model="settings.host">
                </div>
                <div class="field">
                    <label>Namespace</label>
                    <input type="text" v-model="settings.namespace">
                </div>
                <div class="field">
                    <label>Database</label>
                    <input type="text" v-model="settings.database">
                </div>
                <div class="field">
                    <label>Username</label>
                    <input type="text" v-model="settings.username">
                </div>
                <div class="field">
                    <label>Password</label>
                    <input type="password" v-model="settings.password">
                </div>
            </section>
            <section class="history column g-2 p-5" v-if="tab == 'History'">
                <div class="query" v-for="(query, index) in queryHistory" :key="index">
                    <p>{{ query }}</p>
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
            <section class="saved column" v-if="tab == 'Saved'">
                <div class="query-history flex-h" v-for="(query, index) in savedQueries" :key="index">
                    <span style="flex: 0 1 1.5rem">{{ index }}</span>
                    <span style="flex: 1">{{ query }}</span>
                    <div class="flex-h" style="align-items: flex-start;">
                        <button @click="reuseQuery(query)" title="Reuse Query">
                            <i class="fa-solid fa-rotate-right"></i>
                        </button>
                        <button @click="removeQueryFromSaved(query)" title="Remove From Saved">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </div>
            </section>
        </div>
        <div class="right">
            <section class="results column g-2 p-5">
                <div class="result" v-for="result in results">
                    <div class="row g-2">
                        <span>Status: {{ result.status }}</span>
                        <span>Time: {{ result.time }}</span>
                    </div>
                    <code>{{ result.result }}</code>
                </div>
            </section>
        </div>
    </article>
</template>

<style scoped lang="scss">
article {
    height: 100%;
    @include fit-width (1500px, 1rem);

    .left, .right {
        flex: 1 1;
    }
}

section.editor, section.settings, section.history, section.saved, section.results, div.result {
    border-radius: 0.25rem;
    background-color: $dox-white-ultra;
}

section.editor {
    textarea {
        font-weight: 500;
        font-family: "Roboto Mono", monospace;
    }
}

section.settings {
    label {
        font-weight: 700;
    }
}

section.history {
    
    div.query {
        position: relative;
        
        p {
            padding: 1rem;
            white-space: pre-wrap;
            font-weight: 500;
            font-family: "Roboto Mono", monospace;
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
    position: relative;
}

section.results {
    height: 100%;
    @include fit-width (100%, 1.5rem);
    position: absolute;
    overflow-y: auto;

    code {
        white-space: pre-wrap;
        font-weight: 500;
        font-family: "Roboto Mono", monospace;
        background-color: $dox-white-light !important;
    }
}
</style>
