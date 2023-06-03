import { Configuration, OpenAIApi as OpenAI } from "openai";

export interface Message {
    role: "system" | "assistant" | "user"
    content: string
}

const { ml } = useRuntimeConfig()
const openAI = new OpenAI(new Configuration({
    organization: "org-C9prtSYfrzDJNgFtriS5gwUD",
    apiKey: ml.openAiKey,
}))

export const useChat = () => {
    return openAI
}