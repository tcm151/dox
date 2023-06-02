import { Configuration, OpenAIApi as OpenAI } from "openai";

const { ml } = useRuntimeConfig()
const openAI = new OpenAI(new Configuration({
    organization: "org-C9prtSYfrzDJNgFtriS5gwUD",
    apiKey: ml.openAiKey,
}));

export interface Message {
    role: "system" | "assistant" | "user"
    content: string
}

export default defineEventHandler(async (event) => {
    const messages = await readBody<Message[]>(event)
    const response = await openAI.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: messages,
        temperature: 0.5,
        max_tokens: 512,
    })
    return response.data.choices[0].message
})