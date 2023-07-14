<script setup lang="ts">
const props = defineProps<{
    items: any[]
    children: any[]
    getChildren: Function
}>()

const showChildren = ref(true)
function toggleChildren() {
    showChildren.value = !showChildren.value
}
</script>

<template>
    <div class="tree" v-if="children.length > 0">
        <TransitionGroup name="items">
            <div class="outside" v-for="item in children" :key="item.id">
                <div class="comment-line mb-1" @click="toggleChildren"></div>
                <div class="item">
                    <slot name="item" :item="item">
                    </slot>
                    <Transition name="children">
                        <div class="ml-3" v-if="showChildren && getChildren(item, items).length > 0">
                            <Tree :items="items" :children="getChildren(item, items)" :get-children="getChildren">
                                <template v-for="(_, slot) in $slots" v-slot:[slot]="scope: any">
                                    <slot :name="slot" v-bind="scope ?? {}">
                                    </slot>
                                </template>
                            </Tree>
                        </div>
                    </Transition>
                </div>
            </div>
        </TransitionGroup>
    </div>
</template>

<style scoped lang="scss">
.comment-line {
    width: 3px;
    margin-right: 0.25rem;
    border-radius: 0.25em;
    background-color: $dox-white;
    cursor: pointer;
}

.comment-line:hover {
    background-color: $dox-white-light;
}

.outside {
    @include flex-h;
}

.items-move, .items-enter-active, .items-leave-active {
    transition: all 256ms ease-in-out;
}

.items-enter-from, .items-enter-to {
    opacity: 0;
}

.item {
    flex: 1 1;
    @include flex-v;
}
</style>