import { skipHydrate } from "pinia"

interface Settings {
    hintDuration: number
    hoverAnimations: boolean
}

export const useSettings = defineStore("settings", () => {
    const cache = useCache()
    const user = cache.get<Settings>("user.settings", () => ({
        hintDuration: 2500,
        hoverAnimations: true,
    }))
    
    return { user: skipHydrate(user) }
})