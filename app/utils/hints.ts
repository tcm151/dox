
export interface Hint {
    number: number
    message: string
    type: "message" | "success" | "warning" | "error"
    requestId?: string
}

export const useHints = defineStore("hints", () => {
    const events = useEvents()
    const userSettings = useUserSettings()
    
    let count = ref(0)
    let items = ref<Hint[]>([])

    function getRequestId(error?: unknown) {
        if (!error || typeof error !== "object") return undefined

        const response = (error as { response?: { headers?: { get?: (name: string) => string | null } } }).response
        return response?.headers?.get?.("x-request-id") ?? undefined
    }

    function addHint(payload: Hint) {
        items.value.push(payload)
        if (payload.type !== "error") {
            setTimeout(() => remove(payload), userSettings.preferences.ui.hintDuration)
        }
    }
    
    function remove(hint: Hint) {
        items.value = items.value.filter(n => n.number !== hint.number)
    }

    events.subscribe(Trigger.addHint, (payload: Hint) => {
        addHint({
            number: count.value += 1,
            message: payload.message,
            type: payload.type,
            requestId: payload.requestId,
        })
    })

    function addMessage(message: string) {
        addHint({
            number: count.value += 1,
            message: message,
            type: "message"
        })
    }

    function addSuccess(message: string) {
        addHint({
            number: count.value += 1,
            message: message,
            type: "success"
        })
    }

    function addWarning(message: string) {
        addHint({
            number: count.value += 1,
            message: message,
            type: "warning"
        })
    }

    function addError(message: string, error?: unknown) {
        addHint({
            number: count.value += 1,
            message: message,
            type: "error",
            requestId: getRequestId(error),
        })
    }

    return { items, count, addMessage, addSuccess, addWarning, addError, remove }
})
