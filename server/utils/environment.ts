export const ENV = {
    isDevelopment: () => {
        return import.meta.dev
    },
    isProduction: () => {
        return !import.meta.dev
    },
    isServer: () => {
        return import.meta.server
    },
    isClient: () => {
        return import.meta.client
    },
}