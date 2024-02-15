<script setup lang="ts">
const props = defineProps<{
    items: any[]
    children: any[]
    getChildren: Function
}>()

const hideChildren = ref<string>("")
function toggleChildren(id: string) {
    hideChildren.value = (hideChildren.value == id) ? "" : id
}
</script>

<template>
    <main class="tree" v-if="children.length > 0">
        <div class="outside row" v-for="item in children" :key="item.id">
            <aside class="indent-line mb-1 mr-2" :class="{ 'collapsed': hideChildren == item.id }" @click="toggleChildren(item.id)" />
            <div class="item fill">
                <slot name="item" :item="item" />
                <Tree class="ml-3" v-if="hideChildren != item.id" :items="items" :children="getChildren(item, items)" :get-children="getChildren">
                    <template v-for="(_, slot) in $slots" v-slot:[slot]="scope: any">
                        <slot :name="slot" v-bind="scope ?? {}">
                        </slot>
                    </template>
                </Tree>
            </div>
        </div>
    </main>
</template>

<style scoped lang="scss">
.indent-line {
    border-radius: 0.25rem;
    background-color: $dox-white-1;
    cursor: pointer;
    flex: 0 0 5px;
}

.indent-line:hover {
    background-color: $dox-white-2;
}

.indent-line.collapsed {
    background-color: $dox-white-2;
}

.items-move, .items-enter-active, .items-leave-active {
    transition: all 512ms ease-in-out;
}

.items-enter-from, .items-leave-to {
    opacity: 0;
}

.items-leave-active {
    position: absolute;
}
</style>