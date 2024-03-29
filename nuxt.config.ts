// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    experimental: {
        componentIslands: true,
    },
    modules: [
        "@pinia/nuxt",
        "@vueuse/nuxt"
    ],
    components: [
        { path: '~/**/components', pathPrefix: false },
        { path: '~/components', pathPrefix: false },
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
            title: process.env.SMTP_SENDER_TITLE,
        },
        surreal: {
            url: process.env.SURREAL_URL,
            username: process.env.SURREAL_USERNAME,
            password: process.env.SURREAL_PASSWORD,
            namespace: process.env.SURREAL_NAMESPACE,
            database: process.env.SURREAL_DATABASE,
        },
        public: {
            baseUrl: process.env.BASE_URL,
            site: {
                title: process.env.SITE_TITLE,
                titleShort: process.env.SITE_TITLE_SHORT,
            },
            surreal: {
                url: process.env.SURREAL_URL,
                namespace: process.env.SURREAL_NAMESPACE,
                database: process.env.SURREAL_DATABASE,
            }
        }
    },
    app: {
        pageTransition: { name: "swap", mode: 'out-in'},
        layoutTransition: { name: "swap", mode: 'out-in'},
        head: {
            title: process.env.SITE_TITLE,
            link: [
                {
                    rel: "stylesheet",
                    href: "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.2.1/css/all.min.css",
                    integrity: "sha512-MV7K8+y+gLIBoVD59lQIYicR65iaqukzvf/nwasF0nqhPay5w/9lJmVM2hMDcnK1OnMGCdVK+iQrJ7lzPJQd1w==",
                    crossorigin: "anonymous",
                    referrerpolicy: "no-referrer",
                },
            ],
            meta: [
                { name: "viewport", content: "width=device-width, height=device-height, initial-scale=1" },
                { name: "google-adsense-account", content: "ca-pub-3080690900599338" }
            ],
            script: [
                { async: true, src: "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3080690900599338", crossorigin: "anonymous" }
            ]
        },
    },
    routeRules: {
        '/inbox': { ssr: false },
        '/editor': { ssr: false },
        '/admin/**': { ssr: false },
        '/developer/**': { ssr: false },
        '/settings/**': { ssr: false },
    }
})