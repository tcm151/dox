import { defineStore, skipHydrate } from "pinia"

interface Settings {
    hoverAnimations: boolean
    showPreviewByDefault: boolean
}

export const useUserSettings = defineStore("userSettings", () => {
    const state = skipHydrate(useLocalStorage<Settings>("userSettings", {
        hoverAnimations: true,
        showPreviewByDefault: true,
    }));

    return { state };
})