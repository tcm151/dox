interface Error {
    cause?: string
    name?: string
    url: string
    statusCode: number
    statusMessage: string
    message: string
    stack: string
    data?: any
    fatal?: boolean
}

export default defineNuxtPlugin((nuxtApp) => {
    const hints = useHints()
    
    async function errorHandler(error: Error, context: unknown) {
        hints.addError(error.statusMessage)
    }

    nuxtApp.vueApp.config.errorHandler = async (error: unknown, context) => {
        errorHandler(error as Error, context)
    }
})