import { defineStore } from "pinia"

interface Event {
    trigger: Trigger
    action: Function
}

export enum Trigger {
    addHint,
    authenticatedUser,
    pageFinishedLoading,
    showPopup,
    toggleLogin,
    clientStarted,
}

export const useEvents = defineStore("events", () => {
    let events = ref<Event[]>([]);

    function subscribe(trigger: Trigger, action: Function) {
        events.value.push({ trigger: trigger, action: action})
    }

    function unsubscribe(event: Event) {
        events.value = events.value.filter((e) => e === event)
    }

    function publish(trigger: Trigger, payload?: object) {
        events.value.forEach((e) => {
            if (e.trigger === trigger) {
                e.action(payload)
            }
        })
    }

    return { subscribe, unsubscribe, publish }
})
