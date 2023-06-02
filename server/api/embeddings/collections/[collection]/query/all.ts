import { useEmbeddings } from "~/server/chromadb"

const embeddings = useEmbeddings()

export default defineEventHandler(async (event) => {
    const { collection: name } = event.context.params!
    const collection = await embeddings.getCollection(name)
    return await collection.get()
})