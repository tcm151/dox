import { defineStore, skipHydrate } from "pinia";

interface Settings {
    host: string,
    username: string,
    password: string,
    namespace: string,
    database: string,
}

export const useQuery = defineStore("query", () => {
    const settings = skipHydrate(useLocalStorage<Settings>("querySettings", {
        host: "",
        username: "",
        password: "",
        namespace: "",
        database: ""
    }));

    const history = skipHydrate(useLocalStorage<string[]>("queryHistory", []))
    const saved = skipHydrate(useLocalStorage<any[]>("savedQueries", []))

    return { settings, history, saved };
})