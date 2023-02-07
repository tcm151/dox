import { defineStore } from "pinia"

interface Settings {
    hoverAnimations: boolean
}

export const useSettings = defineStore("settings", () => {
    const state = ref<any>({
        hoverAnimations: true
    })
    return { state };
})