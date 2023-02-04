import { defineStore } from "pinia"

export const useHints = defineStore("hints", () => {
    const events = useEvents();

    function addMessage(message: string) {
        events.publish("addHint", {
            message: message,
            type: "message"
        })
    }

    function addSuccess(message: string) {
        events.publish("addHint", {
            message: message,
            type: "success"
        })
    }

    function addWarning(message: string) {
        events.publish("addHint", {
            message: message,
            type: "warning"
        })
    }

    function addError(message: string) {
        events.publish("addHint", {
            message: message,
            type: "error"
        })
    }

    return { addMessage, addSuccess, addWarning, addError }
})
