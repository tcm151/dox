interface Event {
    trigger: string
    action: Function
}

class EventBus {
    events: Event[]

    constructor() {
        this.events = []
    }

    subscribe(event: Event) {
        this.events.push(event)
    }

    unsubscribe(event: Event) {
        this.events = this.events.filter((e) => e === event)
    }

    publish(trigger: string, payload?: any) {
        this.events.forEach((e) => {
            if (e.trigger === trigger) {
                e.action(payload)
            }
        })
    }
}

export default new EventBus()
