<script setup lang="ts">
definePageMeta({
    layout: "simple",
    middleware: (to, from) => {
        const hints = useHints()
        const session = getSession()
        if (to.path === "/chat" && (!session.isAuthenticated || !session.user.confirmed)) {
            hints.addWarning("You must confirm your account to use chat.")
            return abortNavigation()
        }
    }
})

const hints = useHints()
const session = getSession()

const welcomeMessage = { role: "assistant", content: "Hey, what would you like to talk about?" }
const messages = useSessionStorage('chatMessages', [welcomeMessage])

async function resetChat() {
    messages.value = [welcomeMessage]
}

const messageText = ref("")
const waitingForResponse = ref(false)
async function getChatResponse() {
    if (messageText.value == "") {
        hints.addWarning("You can't enter nothing.")
        return
    }

    messages.value.push({
        role: "user", content: messageText.value
    })
    messageText.value = ""

    waitingForResponse.value = true
    const response = await $fetch(`/api/chat/${session.user.id}`, {
        method: "POST",
        body: messages.value.slice(-5)
    })
    waitingForResponse.value = false
    messages.value.push(response)
}

const scroll = ref<HTMLElement | null>(null)
watch(waitingForResponse, () => {
    setTimeout(() => {
        scroll.value!.scrollTop = scroll.value!.scrollHeight
    }, 64)
})

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
                <div class="message assistant px-4 py-2" v-if="waitingForResponse">
                    <i class="fa-solid fa-spinner"></i>
                </div>
            </div>
        </section>
        <section class="column g-2 p-4">
            <div class="field">
                <textarea rows="8" v-model="messageText" @keyup.enter="getChatResponse" />
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

@keyframes spin {
    from {
        transform: rotateZ(0deg);
    }
    to {
        transform: rotateZ(360deg);
    }
}

div.message.assistant:has(i) {
    i.fa-spinner {
        animation: spin 1s linear infinite;
    }
}
</style>