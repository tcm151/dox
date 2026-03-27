export const ENV = {
    isDevelopment: () => {
        return import.meta.dev
    },
    isProduction: () => {
        return import.meta.prod
    },
    isServer: () => {
        return import.meta.server
    },
    isClient: () => {
        return import.meta.client
    },
}