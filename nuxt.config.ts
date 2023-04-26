// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    modules: [
        "@pinia/nuxt",
        "@vueuse/nuxt"
    ],
    components: [
        { path: '~/components', pathPrefix: false }
    ],
    imports: {
        dirs: ["services/**", "datasources/**"],
    },
    vite: {
        css: {
            preprocessorOptions: {
                scss: {
                    additionalData: '@import "~/assets/scss/global.scss";\n'
                }
            }
        }
    },
    nitro: {
        esbuild: {
            options: {
                target: "esnext"
            }
        }
    },
    runtimeConfig: {
        smtp: {
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
        surreal: {
            url: process.env.SURREAL_URL,
            username: process.env.SURREAL_USERNAME,
            password: process.env.SURREAL_PASSWORD,
            namespace: process.env.SURREAL_NAMESPACE,
            database: process.env.SURREAL_DATABASE,
        }
    },
    app: {
        head: {
            title: "DOX For Everything",
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
})