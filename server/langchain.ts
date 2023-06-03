import { ChatOpenAI } from "langchain/chat_models/openai"
import { ChatMessage } from "langchain/schema";

export const useChat = (temperature: number = 0.5, maxTokens: number = 512) => {
    
    const { ml } = useRuntimeConfig()
    const chat = new ChatOpenAI({
        openAIApiKey: ml.openAiKey,
        temperature: temperature,
        maxTokens: maxTokens,
    })
    
    async function respond(messages: ChatMessage[]) {
        return await chat.call(messages)
    }

    return {
        respond
    }
}