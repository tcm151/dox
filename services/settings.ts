import { defineStore, skipHydrate } from "pinia"

interface Settings {
    hintDuration: number
    hoverAnimations: boolean
    showPreviewByDefault: boolean
}

export const useUserSettings = defineStore("userSettings", () => {
    const state = skipHydrate(useLocalStorage<Settings>("userSettings", {
        hintDuration: 2500,
        hoverAnimations: true,
        showPreviewByDefault: true,
    }));

    return { state };
})