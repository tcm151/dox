// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: "2025-12-01",
    devtools: { enabled: false },
    ssr: true,
    modules: [
        "@pinia/nuxt",
        "@vueuse/nuxt"
    ],
    components: [
        { path: "~/components", pathPrefix: false, }
    ],
    imports: {
        dirs: ["@@/shared/types"],
    },
    vite: {
        css: {
            preprocessorOptions: {
                scss: {
                    quietDeps: true,
                    additionalData: [
                        '@use "~/assets/scss/colors" as *;',
                        '@use "~/assets/scss/mixins" as *;',
                    ].join("\n"),
                },
            },
        },
        optimizeDeps: {
            include: [
                'marked',
                'luxon',
                'isomorphic-dompurify',
                'html-entities',
                'highlight.js/lib/common',
            ],
        },
    },
    routeRules: {
        "/inbox": { ssr: false },
        "/editor/**": { ssr: false },
        "/moderator/**": { ssr: false },
        "/topic/*/moderation": { ssr: false},
        "/admin/**": { ssr: false },
        "/developer/**": { ssr: false },
        "/settings/**": { ssr: false },
    },
    nitro: {
        errorHandler: "server/plugins/errorHandler"
    },
    css: [
        "~/assets/scss/global.scss"
    ],
    app: {
        rootId: "app",
        rootTag: "main",
        pageTransition: { name: "swap", mode: "out-in" },
        layoutTransition: { name: "swap", mode: "out-in" },
        head: {
            title: process.env.SITE_TITLE,
            link: [
                { rel: "preconnect", href: "https://fonts.googleapis.com" },
                { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "anonymous" },
                {
                    rel: "stylesheet",
                    href: "https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap"
                },
                {
                    rel: "stylesheet",
                    href: "https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@300;400;500;700;900&display=swap"
                },
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
            ],
        },
    },
    runtimeConfig: {
        smtp: {
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
            title: process.env.SMTP_SENDER_TITLE,
        },
        media: {
            path: process.env.MEDIA_PATH,
        },
        surreal: {
            info: {
                type: process.env.SURREAL_TYPE,
                url: process.env.SURREAL_URL,
                username: process.env.SURREAL_USERNAME,
                password: process.env.SURREAL_PASSWORD,
                namespace: process.env.SURREAL_NAMESPACE,
                database: process.env.SURREAL_DATABASE,
            },
            admin: {
                email: process.env.DEFAULT_USER_EMAIL,
                name: process.env.DEFAULT_USER_NAME,
                password: process.env.DEFAULT_USER_PASSWORD,
            }
        },
        public: {
            baseUrl: process.env.BASE_URL,
            site: {
                title: process.env.SITE_TITLE,
                titleShort: process.env.SITE_TITLE_SHORT,
            },
        },
    },
})
