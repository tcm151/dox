import { useEmbeddings } from "~/server/chromadb"

const embeddings = useEmbeddings()

export default defineEventHandler(async (event) => {
    const texts = await readBody<string[]>(event)
    return await embeddings.generateVectors(texts)
})