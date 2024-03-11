export default defineNuxtPlugin((nuxtApp) => {
    nuxtApp.vueApp.config.errorHandler = async (error, context) => {
        await $fetch("/api/error/add", {
            method: "POST",
            body: { error, context: null }
        })
    }
})