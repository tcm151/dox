<script setup lang="ts">

const activeCollection = ref("")
const { data: collections, refresh: listCollections } = useAsyncData('collections', () => {
    return $fetch("/api/embeddings/collections/list")
})

const collectionName = ref("")
async function addCollection() {
    await $fetch("/api/embeddings/collections/add", {
        method: "POST",
        body: collectionName.value
    })
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
    metadata: {}
})

async function addDocument() {
    await $fetch(`/api/embeddings/collections/${activeCollection.value}/add`, {
        method: "POST",
        body: [currentDocument.value]
    })
}

async function generateVectors() {
    const response = await $fetch(`/api/embeddings/generate`, {
        method: "POST",
        body: currentDocument.value.text
    })

    currentDocument.value.vectors = response[0]
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
            <div class="field">
                <input type="text" v-model="collectionName" />
            </div>
            <button @click="addCollection">Add Collection</button>
        </section>
        <section class="column g-2 p-4">
            <div class="field">
                <label>Document ID</label>
                <input type="text" v-model="currentDocument.id" />
            </div>
            <div class="field">
                <label>Document Text</label>
                <textarea rows="10" v-model="currentDocument.text" />
            </div>
            <div class="row g-2">
                <button @click="addDocument">Add</button>
                <button @click="addDocument">Upsert</button>
                <button @click="generateVectors">Generate Vectors</button>
            </div>
        </section>
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
</style>