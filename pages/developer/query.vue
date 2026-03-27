<script setup lang="ts">
const cache = useCache()
const hints = useHints()

const tab = cache.get<string>("query.tab", () => "History")
const query = cache.get<string>("query.sql", () => "")
const results = cache.get<any[]>("query.results", () => [])
const history = cache.get<string[]>("query.history", () => [])
const selectedResult = cache.get<number>("query.selectedResult", () => 0)

function removeFromHistory(query: string) {
    history.value = history.value.filter(h => h !== query)
    hints.addWarning("Query removed from history")
}

const loading = ref<boolean>(false)
async function submitQuery() {
    try {
        loading.value = true
        results.value = await useApi<any[]>("/api/developer/database/query", {
            body: {
                query: query.value
            }
        })
        
        history.value = history.value.filter(q => q !== query.value)
        history.value.unshift(query.value)
        if (results.value.length > 0) {
            selectedResult.value = results.value.length-1
        }
        tab.value = 'Results'
    }
    catch (error: any) {
        hints.addError(error.message)
    }
    finally {
        loading.value = false
    }
}

const resultPreviews = computed(() => {
    let queries = history.value.at(0)?.split(";") ?? []
    let filtered = queries.filter(q => q.trim() != "").filter((q, i) => results.value[i] != null)
    return filtered.map(q => {
        if (q.trim().length > 32) {
            return q.trim().slice(0, 32) + '...'
        }
        else {
            return q.trim().slice(0, 32)
        }
    })
})
</script>

<template>
    <article class="row g-2 m-4">
        <div class="left box column g-2 p-4">
            <section class="editor f-1 column g-2">
                <header class="row g-2">
                    <button class="danger" @click="query = ''">
                        <i class="fa-solid fa-eraser"></i>
                        <span>Clear</span>
                    </button>
                    <ButtonSpinner class="success f-1" :loading="loading" @click="submitQuery">
                        <i class="fa-solid fa-paper-plane"></i>
                        <span>Submit</span>
                    </ButtonSpinner>
                    <button class="link" @click="navigateTo('https://surrealdb.com/docs/surrealql/', { open: { target: '_blank' } })">
                        <i class="fa-solid fa-file-code"></i>
                        <span>Docs</span>
                    </button>
                </header>
                <div class="field f-1">
                    <textarea class="f-1" rows="8" spellcheck="false" @keydown.enter.alt.prevent="submitQuery" v-model="query" />
                </div>
            </section>
        </div>
        <div class="right box column g-2 p-4">
            <header class="row g-2">
                <button class="link f-1" @click="tab = 'Results'">
                    <i class="fa-solid fa-square-poll-horizontal"></i>
                    <span>Results</span>
                </button>
                <button class="link f-1" @click="tab = 'History'">
                    <i class="fa-solid fa-book"></i>
                    <span>History</span>
                </button>
            </header>
            <section v-if="tab == 'Results'" class="results column">
                <header v-if="results.length > 1" class="tabs row">
                    <template v-for="(label, index) in resultPreviews">
                        <div class="result px-4 py-2" :class="{ active: selectedResult == index }" @click="selectedResult = index">
                            {{ label }}
                        </div>
                    </template>
                    <div class="clear px-4 py-2" @click="results = []">
                        <i class="fa-solid fa-eraser"></i>
                    </div>
                </header>
                <template v-for="(result, index) in results">
                    <Codeblock v-if="selectedResult == index" language="json" :code="JSON.stringify(result, undefined, 4)" />
                </template>
            </section>
            <section v-if="tab == 'History'" class="history column g-2">
                <div class="query" v-for="(item, index) in history" :key="index">
                    <Codeblock language="sql" :code="item" />
                    <div class="tools row g-3 p-3">
                        <button class="p-0" @click="query = item">
                            <i class="fa-solid fa-rotate"></i>
                        </button>
                        <button class="p-0" @click="removeFromHistory(item)">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </div>
            </section>
        </div>
    </article>
</template>

<style scoped lang="scss">

input[type=search]::-webkit-search-cancel-button:hover {
    cursor: pointer;
}

article {
    @include fit-width (2000px, 1rem);
    height: stretch;
    overflow: hidden;

    @media (max-width: $bp-desktop) {
        @include flex-v;
    }

    div.right {
        overflow: hidden;
    }

    div.left { flex: 4 1 }
    div.right { flex: 6 1 }

    @media (max-width: $bp-desktop) {
        div.left { flex: 1 1 }
        div.right { flex: 10 1 }
    }
}

section.editor {
    textarea {
        resize: none;
        font-weight: 500;
        font-family: "Source Code Pro", monospace;
        
        @media (max-width: $bp-desktop) {
            flex: none;
            resize: vertical;
        }
    }
}

section.history {
    overflow-y: auto;

    div.query {
        position: relative;

        div.tools {
            inset: 0 0 auto auto;
            position: absolute;

            button {
                background-color: transparent;
            }

            button:hover {
                color: $white-4;
            }
        }
    }
}

section.results {
    overflow-y: auto;

    header.tabs {

        div.result:first-child {
            border-radius: 0.25rem 0 0 0;
        }

        div.result {
            cursor: pointer;
            font-weight: 500;
            font-family: "Source Code Pro", monospace;
            white-space: nowrap;
            border-right: 1px solid $white-1;
            background-color: $white-2;
        }
        
        div.result:hover {
            text-decoration: underline;
        }
        
        div.result.active {
            background-color: $white-1;
        }

        div.clear {
            cursor: pointer;
            background-color: $white-2;
            border-radius: 0 0.25rem 0 0;
        }

        div.clear:hover {
            color: $red;
        }
    }

    code {
        white-space: pre-wrap;
        font-weight: 500;
        font-family: "Source Code Pro", monospace;
        background-color: $white-1 !important;
        overflow-y: visible;
        overflow-x: hidden;
    }
}
</style>
