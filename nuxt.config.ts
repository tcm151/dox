// https://nuxt.com/docs/api/configuration/nuxt-config
import packageJson from "./package.json"

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
    typescript: {
        tsConfig: {
            include: ["../server/**/*"],
        },
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
        "/topic/*/**": { ssr: false },
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
        trustedProxies: "",
        smtp: {
            host: "",
            port: "",
            user: "",
            pass: "",
            title: "",
        },
        data: {
            path: "",
        },
        surreal: {
            info: {
                type: "",
                url: "",
                username: "",
                password: "",
                namespace: "",
                database: "",
            },
            admin: {
                email: "",
                name: "",
                password: "",
            }
        },
        public: {
            version: packageJson.version,
            baseUrl: "",
            site: {
                title: "",
                titleShort: "",
            },
        },
    },
})
