import { defineStore } from "pinia"
import { Trigger } from "~/services/events";

export const useHints = defineStore("hints", () => {
    const events = useEvents();

    function addMessage(message: string) {
        events.publish(Trigger.addHint, {
            message: message,
            type: "message"
        })
    }

    function addSuccess(message: string) {
        events.publish(Trigger.addHint, {
            message: message,
            type: "success"
        })
    }

    function addWarning(message: string) {
        events.publish(Trigger.addHint, {
            message: message,
            type: "warning"
        })
    }

    function addError(message: string) {
        events.publish(Trigger.addHint, {
            message: message,
            type: "error"
        })
    }

    return { addMessage, addSuccess, addWarning, addError }
})
