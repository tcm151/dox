<script setup lang="ts">

const hints = useHints()

const welcomeMessage = { role: "assistant", content: "Hey, how are you doing today?" }

const messages = useSessionStorage('chatMessages', [welcomeMessage])

const scroll = ref<HTMLElement | null>(null)
watch(messages, () => {
    setTimeout(() => {
        scroll.value!.scrollTop = scroll.value!.scrollHeight
    }, 64)
})

async function resetChat() {
    messages.value = [welcomeMessage]
}

const messageText = ref("")
async function getChatResponse() {
    if (messageText.value == "") {
        hints.addWarning("You can't enter nothing.")
        return
    }

    messages.value.push({
        role: "user", content: messageText.value
    })
    messageText.value = ""

    const response = await $fetch("/api/chat", {
        method: "POST",
        body: messages.value
    })
    messages.value.push(response)
}


</script>

<template>
    <article class="column g-4 p-4">
        <section class="fill chat">
            <div class="scroll column g-4 px-4" ref="scroll">
                <ClientOnly>
                    <div class="message px-4 py-2" :class="message.role" v-for="message in messages">
                        {{ message.content }}
                    </div>
                </ClientOnly>
            </div>
        </section>
        <section class="column g-2 p-4">
            <div class="field">
                <textarea rows="8" v-model="messageText"></textarea>
            </div>
            <div class="row g-2">
                <button class="danger" @click="resetChat">
                    <i class="fa-solid fa-refresh"></i>
                    <span>Reset</span>
                </button>
                <button class="success fill" @click="getChatResponse">
                    <i class="fa-solid fa-paper-plane"></i>
                    <span>Send</span>
                </button>
            </div>
        </section>
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width(500px, 1rem);
}

section {
    border-radius: 0.25rem;
    background-color: $dox-white-ultra;
}

section.chat {
    position: relative;
    overflow-y: hidden;
    
    div.scroll {
        inset: 1rem 0;
        position: absolute;
        // justify-content: flex-end;
        overflow-y: auto;
    }
}

div.message {
    width: fit-content;
    font-weight: 600;
    white-space: break-spaces;
    border-radius: 0.5rem;
}

div.message.user {
    margin-left: 5rem;
    align-self: flex-end;
    color: $dox-purple;
    background-color: $dox-purple-light;
}

div.message.assistant {
    margin-right: 5rem;
    color: $dox-blue;
    background-color: $dox-blue-light;
}
</style>