import { ChromaClient, OpenAIEmbeddingFunction } from "chromadb"

const { ml } = useRuntimeConfig()

const client = new ChromaClient({
    path: "https://chroma.tcmdev.ca"
})

const embedder = new OpenAIEmbeddingFunction({
    openai_api_key: ml.openAiKey
})

export const useEmbeddings = () => {
    async function createCollection(name: string) {
        return await client.createCollection({
            name: name,
            embeddingFunction: embedder,
        })
    }

    async function getCollection(name: string) {
        return await client.getCollection({
            name: name,
            embeddingFunction: embedder,
        })
    }
    
    async function listCollections() {
        return await client.listCollections()
    }

    async function deleteCollection(name: string) {
        return await client.deleteCollection({
            name: name
        })
    }

    async function generateVectors(texts: string[]) {
        return await embedder.generate(texts)
    }

    async function reset() {
        return await client.reset()
    }

    return {
        createCollection, deleteCollection, getCollection, listCollections,
        generateVectors, reset
    }
}