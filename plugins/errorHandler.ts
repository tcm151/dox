export default defineNuxtPlugin((nuxtApp) => {
    nuxtApp.vueApp.config.errorHandler = async (error, context) => {
        console.log(`!ERROR:\n${error}`)
        // await $fetch("/api/error/add", {
        //     method: "POST",
        //     body: { error, context }
        // })
    }
  })