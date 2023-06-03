import { useEmbeddings } from "~/server/chroma"

const embeddings = useEmbeddings()

interface TextQuery {
    searchText: string
    resultAmount: number
}

export default defineEventHandler(async (event) => {
    const { collection: name } = event.context.params!
    const { searchText, resultAmount } = await readBody<TextQuery>(event)
    const collection = await embeddings.getCollection(name)
    return await collection.query({
        nResults: resultAmount,
        queryTexts: searchText,
        where: { userId: "user:opkdyfig54tdre96jc37" }
    })
})