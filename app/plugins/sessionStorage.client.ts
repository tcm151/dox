export default defineNuxtPlugin({
    enforce: "pre",
    setup() {
        const { public: { version } } = useRuntimeConfig()
        try {
            const storage = window.sessionStorage
            if (storage.getItem("appVersion") === version) return

            storage.clear()
            storage.setItem("appVersion", version)
        }
        catch (error) {
            console.warn("Unable to reset session storage for the current app version.", error)
        }
    },
})
