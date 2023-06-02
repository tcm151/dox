import { ChatOpenAI } from "langchain/chat_models/openai"
import { ChatMessage } from "langchain/schema";


const { ml } = useRuntimeConfig()
const chat = new ChatOpenAI({
    openAIApiKey: ml.openAiKey,
    temperature: 0.5,
    maxTokens: 512
})

export const useChat = () => {
    async function respond(messages: ChatMessage[]) {
        await chat.call(messages)
    }

    return {
        respond
    }
}