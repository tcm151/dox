<script setup lang="ts">
const props = defineProps<{
    items: any[]
    children: any[]
    getChildren: Function
}>()

const hiddenChildren = ref<string[]>([])
function toggleChildren(id: string) {
    if (hiddenChildren.value.includes(id)) {
        hiddenChildren.value = hiddenChildren.value.filter(c => c != id)
    }
    else {
        hiddenChildren.value.push(id)
    }
}
</script>

<template>
    <main v-if="children.length > 0" class="tree">
        <template v-for="item in children" :key="item.id">
            <div class="outside row" :class="{ 'collapsed': hiddenChildren.includes(item.id) }">
                <aside class="indent-line mb-1 mr-4" @click="toggleChildren(item.id)" />
                <div class="item f-1">
                    <slot name="item" :item="item" />
                    <Tree v-if="!hiddenChildren.includes(item.id)" class="ml-2" :items="items" :children="getChildren(item, items)" :get-children="getChildren">
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
        margin-bottom: 1rem;
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