import { OpenAI } from "langchain/llms/openai"

const { ml } = useRuntimeConfig()

const model = new OpenAI({
    openAIApiKey: ml.openAiKey
})