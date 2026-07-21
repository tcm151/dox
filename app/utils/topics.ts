import { reactive, ref } from "vue"

export function useTopicManager(initialTopics: string[] = []) {
    const items = ref<string[]>([...initialTopics])
    const text = ref<string>("")

    function add(topic: string) {
        items.value.push(`topic:${topic}`)
        text.value = ""
    }

    function remove(topic: string) {
        items.value = items.value.filter(t => t !== topic)
    }

    function set(topics: string[]) {
        items.value = [...topics]
        text.value = ""
    }

    function clear() {
        set([])
    }

    return reactive({
        text,
        items,
        add,
        remove,
        set,
        clear,
    })
}