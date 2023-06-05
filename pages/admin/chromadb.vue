<script setup lang="ts">

const hints = useHints()
const session = getSession()

const activeCollection = useSessionStorage("chromaCollection", "")
const { data: collections, refresh: refreshCollections } = useAsyncData('collections', () => {
    return $fetch("/api/embeddings/collections/list")
})

const collectionName = ref("")
async function addCollection() {
    await $fetch("/api/embeddings/collections/add", {
        method: "POST",
        body: collectionName.value
    })
    await refreshCollections()
    collectionName.value = ""
}

const showResetPopup = ref(false)
async function resetEmbeddings() {
    await $fetch("/api/embeddings/reset")
    showResetPopup.value = false
}

export interface Document {
    id: string
    text?: string
    vectors?: number[]
    metadata?: { [key: string]: any }
}

const currentDocument = ref<Document>({
    id: "",
    text: "",
    metadata: {
        userId: session.user.id
    }
})

const showAddDocument = ref(false)
async function addDocument() {
    await $fetch(`/api/embeddings/collections/${activeCollection.value}/add`, {
        method: "POST",
        body: [currentDocument.value]
    })
    hints.addSuccess("You added something.")
}

async function generateVectors() {
    const response = await $fetch(`/api/embeddings/generate`, {
        method: "POST",
        body: currentDocument.value.text
    })

    currentDocument.value.vectors = response[0]
}

async function getAllDocuments() {
    if (activeCollection.value == "") {
        hints.addWarning("You need to select a collection.")
        return
    }

    const response = await $fetch(`/api/embeddings/collections/${activeCollection.value}/query/all`)
    queryResults.value = response.ids.map((id, index) => {
        return {
            id: response.ids[index],
            text: response.documents[index],
            metadata: response.metadatas[index],
        }
    })
}

const searchText = ref("")
const resultAmount = ref<number>(1)
const queryResults = ref<any>([])

async function queryCollection() {
    if (activeCollection.value == "") {
        hints.addWarning("You need to select a collection.")
        return
    }

    if (searchText.value == "") {
        hints.addWarning("You can't search for nothing.")
        return
    }

    const response = await $fetch(`/api/embeddings/collections/${activeCollection.value}/query/text`, {
        method: "POST",
        body: {
            searchText: searchText.value,
            resultAmount: resultAmount.value
        }
    })

    queryResults.value = response.ids[0].map((id, index) => {
        return {
            id: response.ids[0][index],
            text: response.documents[0][index],
            metadata: response.metadatas[0][index],
            distance: response.distances![0][index],
        }
    })
}

</script>

<template>
    <article class="column g-4 p-4">
        <section class="row g-2 p-4">
            <div class="field">
                <select @change="activeCollection = ($event.target as HTMLSelectElement).value">
                    <option value="">Select a Collection...</option>
                    <option v-for="collection in collections" :value="collection.name"
                            :selected="collection.name == activeCollection">
                        {{ collection.name }}
                    </option>
                </select>
            </div>
            <div class="field fill">
                <input type="text" v-model="collectionName" />
            </div>
            <button @click="addCollection">Add Collection</button>
            <button @click="showAddDocument = !showAddDocument">Add Document</button>
            <button @click="showResetPopup = true">Reset</button>
        </section>
        <section class="column g-2 p-4" v-if="showAddDocument">
            <div class="row g-2">
                <div class="field fill">
                    <label>Document ID</label>
                    <input type="text" v-model="currentDocument.id" />
                </div>
                <!-- <div class="field fill">
                    <label>Metadata (User ID)</label>
                    <input type="text" v-model="currentDocument.metadata!.userId" />
                </div> -->
            </div>
            <div class="field">
                <label>Document Text</label>
                <textarea rows="10" v-model="currentDocument.text" />
            </div>
            <div class="row g-2">
                <button class="fill" @click="addDocument">Add</button>
                <button @click="addDocument">Upsert</button>
                <button @click="generateVectors">Generate Vectors</button>
            </div>
        </section>
        <section class="p-4">
            <div class="row g-2">
                <button @click="getAllDocuments">Query All</button>
                <div class="field fill">
                    <input type="search" v-model="searchText" placeholder="Search..." @keyup.enter="queryCollection">
                </div>
                <div class="field">
                    <input type="number" v-model="resultAmount" style="width: 3rem; text-align: center;" />
                </div>
                <button @click="queryCollection">Search</button>
            </div>
            <div>
                <Codeblock
                    :wrap="true" 
                    language="json"
                    :code="JSON.stringify(queryResults, undefined, 4)" 
                />
            </div>
        </section>
        <Popup
            :visible="showResetPopup"
            title="Reset Embeddings"
            accept-label="Reset"
            @accept="resetEmbeddings"
            decline-label="Cancel"
            @decline="showResetPopup = false"
        >
            <p>This cannot be undone. Are you sure you want to do this?</p>
        </Popup>
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width(800px, 1rem);
}

section {
    border-radius: 0.25rem;
    background-color: $dox-white-ultra;
}

input[type=number]::-webkit-inner-spin-button {
    opacity: 1
}
</style>