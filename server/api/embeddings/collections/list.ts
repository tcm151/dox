import { useEmbeddings } from "~/server/chromadb"

const embeddings = useEmbeddings()

export default defineEventHandler(async (event) => {
    return await embeddings.listCollections()
})