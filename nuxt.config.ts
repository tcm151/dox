// https://nuxt.com/docs/api/configuration/nuxt-config
import { execFileSync } from "node:child_process"
import packageJson from "./package.json"

// Git metadata may be unavailable when building from a source archive.
function readGitMetadata(args: string[]) {
    try {
        return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim()
    }
    catch {
        return ""
    }
}

const gitCommit = readGitMetadata(["rev-parse", "--short=12", "HEAD"])
const gitRef = readGitMetadata(["branch", "--show-current"]) || readGitMetadata(["describe", "--always", "--tags", "HEAD"])

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
                    href: "https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap"
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
            buildDate: new Date().toISOString(),
            gitCommit,
            gitRef,
            site: {
                title: "",
                titleShort: "",
            },
        },
    },
})
