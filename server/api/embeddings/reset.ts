import { useEmbeddings } from "~/server/chroma"

const embeddings = useEmbeddings()

export default defineEventHandler(async (event) => {
    return await embeddings.reset()
})