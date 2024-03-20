<script setup lang="ts">
const showTop = ref(true)
const showMiddle = ref(true)
const showBottom = ref(true)

const shownTab = ref<string>("top")
</script>

<template>
    <article class="p-5">
        <header class="row g-2">
            <button @click="shownTab = 'top'">
                Show Top
            </button>
            <button @click="shownTab = 'middle'">
                Show Middle
            </button>
            <button @click="shownTab = 'bottom'">
                Show Bottom
            </button>
        </header>
        <section class="animations column g-4 mt-4">
            <TransitionGroup name="scale-example">
                <!-- <section class="beginning box p-4">
                    <h2>Beginning</h2>
                    <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Tempora id iure nostrum optio, et molestiae dicta qui eveniet eius, sint architecto temporibus suscipit similique assumenda, hic adipisci officia consequatur vitae.</p>
                </section> -->
                <section class="top box p-4" v-if="shownTab == 'top'" key="top">
                    <h2>Top</h2>
                    <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Quaerat suscipit rerum recusandae ducimus cum, soluta impedit esse iusto, beatae doloremque dolor eligendi aliquam iste sit consectetur! Reiciendis odit sed optio.</p>
                    <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Quaerat suscipit rerum recusandae ducimus cum, soluta impedit esse iusto, beatae doloremque dolor eligendi aliquam iste sit consectetur! Reiciendis odit sed optio.</p>
                </section>
                <section class="middle box p-4" v-if="shownTab == 'middle'" key="middle">
                    <h2>Middle</h2>
                    <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Tempora id iure nostrum optio, et molestiae dicta qui eveniet eius, sint architecto temporibus suscipit similique assumenda, hic adipisci officia consequatur vitae.</p>
                </section>
                <section class="bottom box p-4" v-if="shownTab == 'bottom'" key="bottom">
                    <h2>Bottom</h2>
                    <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Tempora id iure nostrum optio, et molestiae dicta qui eveniet eius, sint architecto temporibus suscipit similique assumenda, hic adipisci officia consequatur vitae.</p>
                    <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Tempora id iure nostrum optio, et molestiae dicta qui eveniet eius, sint architecto temporibus suscipit similique assumenda, hic adipisci officia consequatur vitae.</p>
                    <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Tempora id iure nostrum optio, et molestiae dicta qui eveniet eius, sint architecto temporibus suscipit similique assumenda, hic adipisci officia consequatur vitae.</p>
                </section>
                <section class="final box p-4">
                    <h2>Final</h2>
                    <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Tempora id iure nostrum optio, et molestiae dicta qui eveniet eius, sint architecto temporibus suscipit similique assumenda, hic adipisci officia consequatur vitae.</p>
                </section>
            </TransitionGroup>
        </section>
    </article>
</template>

<style scoped lang="scss">
article {
    @include fit-width(60rem, 1rem);
}

section.animations {
    transition: all 256ms;
}

.scale-example-move,
.scale-example-enter-active,
.scale-example-leave-active {
    transition: all 1s ease;
}

.scale-example-enter-from {
    // opacity: 0;
    transform: translateY(-50%) scaleY(0);
}

.scale-example-leave-to {
    opacity: 0;
    transform: translateY(-50%) scaleY(0);
}

.scale-example-leave-to:not(:first-child, :last-child) {
    opacity: 0;
    transform: scaleY(0);
}

.scale-example-leave-active:not(:last-child) {
    position: absolute;
}
</style>