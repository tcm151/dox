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
        <template v-for="item in children" :key="item.id">
            <div class="outside row" :class="{ 'collapsed': hideChildren == item.id }">
                <aside class="indent-line mb-1 mr-4" @click="toggleChildren(item.id)" />
                <div class="item fill">
                    <slot name="item" :item="item" />
                    <Tree class="ml-2" v-if="hideChildren != item.id" :items="items" :children="getChildren(item, items)" :get-children="getChildren">
                        <template v-for="(_, slot) in $slots" v-slot:[slot]="scope">
                            <slot :name="slot" v-bind="scope ?? {}">
                            </slot>
                        </template>
                    </Tree>
                </div>
            </div>
        </template>
    </main>
</template>

<style scoped lang="scss">
.indent-line {
    border-radius: 0.25rem;
    background-color: $white-1;
    cursor: pointer;
    flex: 0 0 8px;
}

.indent-line:hover {
    background-color: $white-2;
}

.outside.collapsed .indent-line {
    background-color: $white-2;
}

:deep(.outside.collapsed) {
    header {
        margin-bottom: 2rem;
    }
    .markdown {
        display: none;
    }
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