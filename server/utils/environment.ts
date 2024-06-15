export const ENV = {
    isDevelopment: () => {
        return (process.env.NODE_ENV == "development")
    }
}