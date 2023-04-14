<script setup lang="ts">
const props = defineProps<{
    visible: boolean
    title?: string
    width?: number
    height?: number
}>()

const emit = defineEmits<{
    (event: 'close'): void
}>()

let windowTop = ref((window.visualViewport!.height - props.height!) / 2);
let windowLeft = ref((window.visualViewport!.width - props.width!) / 2);
let holdingWindow = ref(false);

function grabWindow(event: MouseEvent) {
    holdingWindow.value = true;
}

function moveWindow(event: MouseEvent) {
    if (holdingWindow.value === true) {
        windowTop.value += event.movementY;
        windowLeft.value += event.movementX;
    }
}

function releaseWindow() {
    holdingWindow.value = false;
}

// function dragTopLeftCorner() {
// }

// function dragTopRightCorner() {
// }

// function dragBottomLeftCorner() {
// }

// function dragBottomRightCorner() {
// }
</script>

<template>
    <div class="popup" v-if="props.visible" @mousemove="moveWindow" @mouseup="releaseWindow" @mouseleave="releaseWindow">
        <div class="window" ref="window" :style="{ width: `${width}px`, height: `${height}px`, top: `${windowTop}px`, left: `${windowLeft}px` }">
            <div class="title-bar" @mousedown="grabWindow">
                <h2 class="title px-4 py-2" v-if="title">{{ title }}</h2>
                <div class="close" @click="$emit('close')">
                    <i class="fa-solid fa-xmark"></i>
                </div>
            </div>
            <div class="window-slot" sty>
                <slot />
            </div>
            <!-- <svg class="top-left-corner" height="15" width="15">
                <polygon points="0,0 15,0 0,15" @mousedown="dragTopLeftCorner"/>
            </svg>
            <svg class="top-right-corner" height="15" width="15">
		        <polygon points="0,0 15,15 15,0" @mousedown="dragTopRightCorner" />
            </svg>
            <svg class="bottom-left-corner" height="15" width="15">
                <polygon points="0,0 15,15 0,15" @mousedown="dragBottomLeftCorner"/>
            </svg>
            <svg class="bottom-right-corner" height="15" width="15">
		        <polygon points="15,15 0,15 15,0" @mousedown="dragBottomRightCorner" />
            </svg> -->
        </div>
    </div>
</template>

<style scoped lang="scss">

@keyframes blur {
    from { backdrop-filter: none }
    to { backdrop-filter: blur(0.5rem) }
}

@keyframes fade-in {
    from { opacity: 0% }
    to { opacity: 100% }
}

.popup {
    top: 0;
    left: 0;
    position: absolute;
    width: 100vw;
    height: 100vh;
    z-index: 9999;

    @include flex-v;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    animation: blur 64ms forwards;
}

.window {
    position: absolute;

    @include flex-v;
    border-radius: 0.25rem;
    background-color: white;
    box-shadow: 0.25rem 0.5rem 1rem -0.25rem #BBBA, 0 0 0.33rem 1px #CCCA;
    animation: fade-in 256ms;
}

.title-bar {
    @include flex-h (1rem);
    align-items: stretch;
    justify-content: space-between;
    color: $dox-white-ultra;
    background-color: $dox-black;
    border-top-left-radius: 0.25rem;
    border-top-right-radius: 0.25rem;
    user-select: none;

    .close {
        @include flex-h;
        align-items: center;
        padding: 0 0.75rem;

        i {
            font-size: 1.5rem;
            line-height: 1.5rem;
        }
    }
    
    .close:hover {
        // color: $dox-red;
        background-color: $dox-red;
    }
}

.window-slot {
    padding: 1rem;
    @include flex-v;
    background-color: $dox-white-ultra;
    overflow-y: auto;
}

// .top-left-corner,
// .top-right-corner,
// .bottom-left-corner,
// .bottom-right-corner {
//     position: absolute;
//     user-select: none;

//     polygon {
//         fill: transparent;
//     }
    
//     polygon:hover {
//         fill: red;
//     }
// }

// .top-left-corner {
//     top: 0;
//     left: 0;
// }

// .top-right-corner {
//     top: 0;
//     right: 0;
// }

// .bottom-left-corner {
//     bottom: 0;
//     left: 0;
// }

// .bottom-right-corner {
//     bottom: 0;
//     right: 0;
// }
</style>