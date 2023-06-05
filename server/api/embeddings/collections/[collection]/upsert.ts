import { useEmbeddings } from "~/server/chroma"
import { Document } from "~/pages/admin/chromadb.vue"

const embeddings = useEmbeddings()

export default defineEventHandler(async (event) => {
    const { collection: name } = event.context.params!
    const documents = await readBody<Document[]>(event)
    const collection = await embeddings.getCollection(name)
    return await collection.upsert({
        ids: documents.map(i => i.id),
        metadatas: documents.map(i => i.metadata ?? { source: "unknown" }),
        documents: documents.map(i => i.text ?? ""),
    })
})