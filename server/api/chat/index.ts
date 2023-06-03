import { useEmbeddings } from "~/server/chroma";
import { Message, useChat } from "~/server/chat"

const openAI = useChat()
const embeddings = useEmbeddings()
const collection = await embeddings.getCollection("chat")

export default defineEventHandler(async (event) => {
    const messages = await readBody<Message[]>(event)
    const relevantMessages = await collection.query({
        nResults: 10,
        queryTexts: JSON.stringify(messages.at(-1))
    })
    messages.unshift(...relevantMessages.documents[0].map(m => JSON.parse(m!) as Message).reverse())
    const embeddingPromise = collection.add({ ids: new Date().toISOString(), documents: JSON.stringify(messages.at(-1)) })
    const chatPromise = openAI.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: messages,
        temperature: 0.5,
        max_tokens: 512,
    })

    const [embedding, chat] = await Promise.all([embeddingPromise, chatPromise])
    await collection.add({ ids: new Date().toISOString(), documents: JSON.stringify(chat.data.choices[0].message) })
    return chat.data.choices[0].message
})