export const ENV = {
    isDevelopment: () => import.meta.dev,
    isProduction: () => !import.meta.dev,
    isServer: () => import.meta.server,
    isClient: () => import.meta.client,
}