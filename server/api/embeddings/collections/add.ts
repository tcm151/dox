import { useEmbeddings } from "~/server/chromadb"

const embeddings = useEmbeddings()

export default defineEventHandler(async (event) => {
    const name = await readBody<string>(event)
    return await embeddings.createCollection(name)
})