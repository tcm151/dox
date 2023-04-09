import { defineStore, skipHydrate } from "pinia"

interface Settings {
    hoverAnimations: boolean
    showPreviewByDefault: boolean
}

export const useSettings = defineStore("settings", () => {
    const state = skipHydrate(useLocalStorage("settings", {
        hoverAnimations: true,
        showPreviewByDefault: true,
    }));

    return { state };
})