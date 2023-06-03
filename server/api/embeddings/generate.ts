import { useEmbeddings } from "~/server/chroma"

const embeddings = useEmbeddings()

export default defineEventHandler(async (event) => {
    const texts = await readBody<string[]>(event)
    return await embeddings.generateVectors(texts)
})