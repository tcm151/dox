<script setup lang="ts">

interface DirectoryItem {
    type: "folder" | string
    parent: string
    name: string
    editing?: boolean
    [key: string]: any
}

const props = defineProps<{
    root: string
    items: DirectoryItem[]
    buttons?: ("add-file" | "add-folder")[]
}>()

const emit = defineEmits<{
    (event: 'addItem', $event: DragEvent, folder: DirectoryItem): void
    (event: 'selectItem', item: DirectoryItem): void
    (event: 'removeItem', item: DirectoryItem): void
}>()

const currentFolder = ref<DirectoryItem>({ type: 'folder', name: '', parent: ''})

function folderItems() {
    return props.items.filter(i => i.parent === currentFolder.value.name)
}

function calculatePath() {
    let path = [currentFolder.value]
    let folder = currentFolder.value
    for (let i = 0; i < 32; i++) {
        let parent = props.items.find(f => f.name == folder.parent && !f.editing)
        if (parent) {
            path.unshift(parent)
            folder = parent
        }
        else {
            if (!path.some(i => i.name == '')) {
                path.unshift({ type: 'folder', name: '', parent: ''})
            }
            return path
        }
    }
    return path
}

function selectItem(item: DirectoryItem) {
    if (item.type == 'folder' && !item.editing) {
        currentFolder.value = item
    }
    if (item.type == 'file' && !item.editing) {
        emit('selectItem', item)
    }
}

function addFolder() {
    props.items.push({
        editing: true,
        type: 'folder',
        name: '',
        parent: currentFolder.value.name,
    })
}

function addFile() {
    props.items.push({
        editing: true,
        type: 'file',
        name: '',
        parent: currentFolder.value.name,
    })
}

function saveItem(item: DirectoryItem) {
    item.editing = false
    props.items.sort((first, second) => {
        if (first.type == 'folder' && second.type != 'folder') {
            return -1
        }
        else if (second.type == 'folder' && first.type != 'folder') {
            return 1
        }
        else {
            return first.name.localeCompare(second.name)
        }
    })
}

const grabbedItem = ref<DirectoryItem | null>(null)
function grabItem(item: DirectoryItem) {
    grabbedItem.value = item
}

function moveItem(target: DirectoryItem) {
    if (target.type == 'folder') {
        grabbedItem.value!.parent = target.name
    }
}
</script>

<template>
    <section class="directory column g-2">
        <header class="row center-inline g-2">
            <div class="fill row g-2">
                <h4
                    class="row center-inline g-2"
                    v-for="folder in calculatePath()"
                    @click="selectItem(folder)"
                    @dragover.prevent=""
                    @drop="moveItem(folder)"
                >
                    <i class="fa-solid fa-caret-right"></i>
                    <span v-if="folder.name == ''">{{ root }}</span>
                    <span v-else>{{ folder.name }}</span>
                </h4>
            </div>
            <button class="link" @click="addFile" v-if="buttons?.includes('add-file')">
                <i class="fa-solid fa-file-circle-plus"></i>
            </button>
            <button class="link" @click="addFolder" v-if="buttons?.includes('add-folder')">
                <i class="fa-solid fa-folder-plus"></i>
            </button>
        </header>
        <div class="fill column g-1" @dragover.prevent="" @drop="emit('addItem', $event, currentFolder)">
            <div v-for="item in folderItems()"
                class="folder"
                @dblclick="selectItem(item)"
                draggable="true"
                @dragstart="grabItem(item)"
                @dragover.prevent=""
                @drop="moveItem(item)"
                @contextmenu.prevent="emit('removeItem', item)"
            >
                <div class="editing row center-inline" v-if="item.editing">
                    <i class="fa-solid fa-folder pl-3" v-if="item.type =='folder'"></i>
                    <input type="text" spellcheck="false" v-model="item.name" @keydown.enter="saveItem(item)">
                </div>
                <span class="row center-inline g-2" v-else>
                    <i class="fa-solid fa-folder" v-if="item.type =='folder'"></i>
                    <span>{{ item.name }}</span>
                </span>
            </div>
        </div>
    </section>
</template>

<style scoped lang="scss">

section.directory {
    height: 100%;
}

header {
    min-height: 32px;

    div {
        padding: 5px 0.75rem;
        border-radius: 0.25rem;
        color: $dox-blue;
        background-color: $dox-blue-light;
    }

    span {
        cursor: pointer;
    }
}

header.row, header.row div.row {
    align-items: stretch;
}

div.folder {
    cursor: pointer;
    padding: 0.25rem 0.75rem;
    border-radius: 0.25rem;
    background-color: $dox-white-light;
}

div.folder:hover {
    background-color: $dox-white;
}

div.folder:has(input) {
    border: 1px solid $dox-blue;
    padding: 0;
    
    input {
        flex: 1 1;
        padding: 3.5px 0.50rem;
        border: none;
        outline: none;
        background: transparent;
        font-size: inherit;
        font-weight: inherit;
        font-family: inherit;
    }
}
</style>