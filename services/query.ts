import { defineStore, skipHydrate } from "pinia";

export const useQuery = defineStore("query", () => {
    const history = skipHydrate(useLocalStorage<string[]>("queryHistory", []))
    const saved = skipHydrate(useLocalStorage<any[]>("savedQueries", []))

    return { history, saved };
})