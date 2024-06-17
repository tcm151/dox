
export const useQuery = defineStore("query", () => {
    const cache = useCache()
    
    const history = cache.get<string[]>("query.history", () => [])
    const saved = cache.get<any[]>("query.saved", () => [])

    return { history, saved }
})