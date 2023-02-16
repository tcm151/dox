import { defineStore, skipHydrate } from "pinia"

interface Settings {
    hoverAnimations: boolean
}

export const useSettings = defineStore("settings", () => {
    const state = skipHydrate(useLocalStorage("settings", {
        hoverAnimations: true
    }));

    return { state };
})