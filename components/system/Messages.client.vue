<script setup lang="ts">
// TODO messages are not complete

const showMessages = ref(false)
function toggleShowMessages() {
    showMessages.value = !showMessages.value
}

</script>

<template>
    <aside class="messages row g-2 pt-2" :class="{ open: showMessages }">
        <section class="toggle grid center p-2">
            <i class="fa-solid fa-circle-chevron-up" v-if="!showMessages" @click="toggleShowMessages"></i>
            <i class="fa-solid fa-circle-chevron-down" v-else @click="toggleShowMessages"></i>
        </section>
        <div class="fill" />
        <TransitionGroup name="messages">
            <section class="chat row center-inline px-3 py-2" v-if="showMessages" v-for="index in 3">
                <div class="row center-inline g-2">
                    <i class="fa-solid fa-message"></i>
                    <span>User</span>
                </div>
                <i class="fa-solid fa-xmark"></i>
            </section>
        </TransitionGroup>
    </aside>
</template>

<style scoped lang="scss">

@property --gradient-black {
    syntax: '<color>';
    initial-value: rgba(255, 0, 0, 0);
    inherits: false;
}

@property --gradient-transparent {
    syntax: '<color>';
    initial-value: rgba(255, 0, 0, 0);
    inherits: false;
}

aside.messages {
    width: 100%;
    bottom: 0;
    position: absolute;
    justify-content: end;
    isolation: isolate;
    z-index: 10000;

    background: linear-gradient(to top, var(--gradient-black), var(--gradient-transparent));
    --gradient-black: rgba(255, 0, 0, 0);
    transition: --gradient-black 512ms ease;
}


aside.messages.open {
    background: linear-gradient(to top, var(--gradient-black), var(--gradient-transparent));
    --gradient-black: rgba(39, 40, 56, 0.25);
    transition: --gradient-black 512ms ease;
}

.messages-move, .messages-enter-active, .messages-leave-active {
    transition: all 512ms ease;
}

.messages-enter-from, .messages-leave-to {
    transform: translateY(100%);
}

section.toggle {
    font-size: 1.5rem;
    cursor: pointer;
}

section.chat {
    width: 200px;
    justify-content: space-between;
    color: $dox-white-0;
    border-radius: 0.25rem 0.25rem 0 0;
    background-color: $dox-black-0;
    cursor: pointer;
}
</style>