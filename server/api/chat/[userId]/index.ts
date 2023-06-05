import { useEmbeddings } from "~/server/chroma";
import { Message, useChat } from "~/server/chat"

const openAI = useChat()
const embeddings = useEmbeddings()
const collection = await embeddings.getCollection("chat")

export default defineEventHandler(async (event) => {
    const { userId } = event.context.params!
    const messages = await readBody<Message[]>(event)
    const relevantMessages = await collection.query({
        queryTexts: JSON.stringify(messages.at(-1)),
        nResults: 20 - messages.length,
        where: { userId: userId },
    })
    console.log(relevantMessages)
    messages.unshift(...relevantMessages.documents[0].map(m => JSON.parse(m!) as Message).reverse())

    const [embedding, chat] = await Promise.all([
        collection.add({
            ids: new Date().toISOString(),
            metadatas: { userId: userId },
            documents: JSON.stringify(messages.at(-1)),
        }),
        openAI.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: messages,
            temperature: 0.5,
            max_tokens: 512,
        })
    ])
    await collection.add({
        ids: new Date().toISOString(),
        metadatas: { userId: userId },
        documents: JSON.stringify(chat.data.choices[0].message)
    })
    return chat.data.choices[0].message
})