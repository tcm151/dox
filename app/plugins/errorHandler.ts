export default defineNuxtPlugin((nuxtApp) => {
    const hints = useHints()
    
    nuxtApp.vueApp.config.errorHandler = (error: any, context) => {
        hints.addError(error.statusText)
    }
})