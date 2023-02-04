// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    modules: [
        "@pinia/nuxt",
        "@pinia-plugin-persistedstate/nuxt"
    ],
    piniaPersistedstate: {
        storage: "sessionStorage"
    },
    app: {
        head: {
            title: "Dox",
            link: [
                {
                    rel: "stylesheet",
                    href: "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.2.1/css/all.min.css",
                    integrity: "sha512-MV7K8+y+gLIBoVD59lQIYicR65iaqukzvf/nwasF0nqhPay5w/9lJmVM2hMDcnK1OnMGCdVK+iQrJ7lzPJQd1w==",
                    crossorigin: "anonymous",
                    referrerpolicy: "no-referrer",
                },
            ],
        },
    },
    imports: {
        dirs: ["services/**"],
    },
    runtimeConfig: {
        surrealDatabaseUrl: process.env.SURREAL_DATABASE_URL,
        surrealUsername: process.env.SURREAL_USERNAME,
        surrealPassword: process.env.SURREAL_PASSWORD
    },
    css: ['@/assets/global.scss'],
    vite: {},
    webpack: {},
})