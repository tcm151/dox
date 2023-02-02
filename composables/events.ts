import { defineStore } from "pinia"

interface Event {
    trigger: string
    action: Function
}

export const useEvents = defineStore("events", () => {
    let events = ref<Event[]>([]);

    function subscribe(trigger: string, action: Function) {
        events.value.push({ trigger: trigger, action: action})
    }

    function unsubscribe(event: Event) {
        events.value = events.value.filter((e) => e === event)
    }

    function publish(trigger: string, payload?: object) {
        events.value.forEach((e) => {
            if (e.trigger === trigger) {
                e.action(payload)
            }
        })
    }

    return { subscribe, unsubscribe, publish }
})
