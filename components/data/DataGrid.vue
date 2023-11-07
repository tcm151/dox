<script setup lang="ts">
import type { Format } from "~/utils/format";

export interface GridColumn {
    field: string
    type?: 'text' | 'number' | 'checkbox' | 'email' | 'range' | 'tel' | 'date' | 'month' | 'week' | 'time'
    label?: string
    width?: string
    format?: Format
    editable?: boolean
    template?: boolean
    placeholder?: string
    textAlign?: "left" | "center" | "right"
    wrap?: "break-spaces" | "normal" | "nowrap" | "pre" | "pre-wrap"
}

interface GridItem {
    index?: number
    selected?: boolean
    editing?: boolean
    new?: boolean
    modified?: boolean
    deleted?: boolean
    backup?: any
    [key: string]: any
}

//> PROPS
const props = defineProps<{
    title?: string          // set the title of the grid
    flex?: string           // set the flex size of the grid
    height?: string         // set the height of the grid
    draggable?: boolean     // allow drag and drop reordering
    checkboxes?: boolean    // show checkboxes 
    pagination?: {
        pageSize: number
    }
    groupBy?: string        // group the items by a specific field
    search?: string[]       // the fields to check when searching
    tools?: Tools[]         // define which tools are shown
    items: GridItem[]       // the items to be displayed
    columns: GridColumn[]   // the grid columns definitions
}>();
type Tools = "edit" | "add" | "delete" | "save" | "refresh"


//> EMITS
const emit = defineEmits<{
    (event: 'refresh'): void
    (event: 'openItem', item: any): void
    (event: 'selectItem', item: any): void
    (event: 'addItem'): void
    (event: 'editItem', item: any, cancel: Function): void 
    (event: 'saveItem', item: any): void
    (event: 'removeItem', item: any): void
    (event: 'saveChanges', changes: { added: any[], updated: any[], deleted: any[] }): void
}>()

// EDITING FUNCTIONS
function openItem(item: any) {
    if (!item.editing) {
        emit('openItem', item);
    }
}

function editItem(item: any) {
    item.backup = {};
    for (let key in item) {
        if (key !== "backup") {
            item.backup[key] = item[key];
        }
    }
    item.editing = true;
    emit('editItem', item, resetItem)
}

function saveItem(item: any) {
    delete item.backup;
    item.editing = false;
    item.modified = true;
    emit("saveItem", item);
}

function resetItem(item: any) {
    if (item.new) {
        const index = props.items.indexOf(item)
        props.items.splice(index, 1)
    }
    else if (item.deleted) {
        item.deleted = false
    }
    else if (item.backup) {
        for (let key in item.backup) {
            item[key] = item.backup[key];
        }
        delete item.backup
        item.editing = false
        item.modified = false
    }
}

function removeItem(item: any) {
    item.deleted = true;
    emit('removeItem', item)
}

const activeChanges = computed(() => {
    return props.items.some(i => i.editing || i.new || i.modified || i.deleted)
})

function cancelChanges() {
    props.items.forEach(i => resetItem(i))
}

function saveChanges() {
    let added = props.items.filter(i => i.new && !i.deleted)
    let updated = props.items.filter(i => !i.new && i.modified && !i.deleted)
    let deleted = props.items.filter(i => i.deleted && !i.new)
    emit('saveChanges', { added, updated, deleted })
}


//> SORTING FUNCTIONS
let sortField = ref<string>("")
let sortType = ref<"" | "asc" | "desc">("");

// BUG need to handle situation where value is null
function sortBy(field: string) {
    if (sortType.value === "") {
        props.items.forEach((item, index) => {
            item.index = index;
        })
        sortType.value = "asc";
    }
    else if (field !== sortField.value) sortType.value = "asc"
    else if (sortType.value === "asc") sortType.value = "desc";
    else if (sortType.value === "desc") sortType.value = "";

    switch (sortType.value) {
        case "": {
            sortField.value = "";
            props.items.sort((first, second) => {
                return (first.index ?? -1) > (second.index ?? -1) ? 1 : -1;
            })
            return;
        }
        case "asc": {
            sortField.value = field;
            props.items.sort((first, second) => {
                if (first[field] === second[field]) return 0
                if (isNaN(first[field]) && isNaN(second[field])) {
                    return first[field].localeCompare(second[field], 'en', { sensitivity: 'base'})
                }
                else {
                    return first[field] > second[field] ? 1 : -1;
                }
            })
            return;
        }
        case "desc": {
            sortField.value = field;
            props.items.sort((first, second) => {
                if (first[field] === second[field]) return 0
                if (isNaN(first[field]) && isNaN(second[field])) {
                    return second[field].localeCompare(first[field], 'en', { sensitivity: 'base'})
                }
                else {
                    return first[field] > second[field] ? -1 : 1;
                }
            })
            return;
        }
    }
}


//> PAGING FUNCTIONS
let pageNumber = ref(1);
let itemsPerPage = ref(props.pagination?.pageSize ?? 250);

function pageCount() {
    // minumum 1 page, max 10 pages, otherwise only required amount of pages
    return Math.max(1, Math.min(10, Math.ceil(filteredItems.value.length / itemsPerPage.value)))
}

function gotoPage(page: number) {
    pageNumber.value = page;
}

const pagedItems = computed(() => {
    let startIndex = (pageNumber.value - 1) * itemsPerPage.value;
    return filteredItems.value.slice(startIndex, startIndex + itemsPerPage.value)
})

function nextPage() {
    const lastPage = Math.ceil(props.items.length / itemsPerPage.value)
    pageNumber.value = Math.min(pageNumber.value + 1, lastPage);
}

function previousPage() {
    pageNumber.value = Math.max(1, pageNumber.value - 1);
}


//> DRAGGING FUNCTIONS
let dragStartIndex = ref(-1);
let dragStopIndex = ref(-1);
let draggedItem = ref<any>({});

function dragItem(item: any) {
    draggedItem.value = item;
    dragStartIndex.value = props.items.indexOf(item);
}

function placeItem(item: any) {
    dragStopIndex.value = props.items.indexOf(item);
    props.items.splice(dragStartIndex.value, 1);
    props.items.splice(dragStopIndex.value, 0, draggedItem.value);
}

//> SEARCH FUNCTIONS
let searchContent = ref("");

const filteredItems = computed(() => {
    if (props.search) {
        return props.items.filter(item => {
            return props.search?.some(field => {
                return item.hasOwnProperty(field)
                    && String(item[field]).toLowerCase().includes(searchContent.value.toLowerCase())
            })
        })
    }
    else {
        return props.items
    }
})

// CHECKBOXES
const allSelected = computed(() => props.items.every(item => item.selected))

function clickCheckbox(item: any) {
    if (item.modified) {
        item.modified = false
        emit('selectItem', item)
    }
    else {
        item.modified = true
        emit('selectItem', item)
    }
}

function toggleSelectAll() {
    if (!allSelected.value) {
        filteredItems.value.forEach(item => {
            if (item.modified) {
                item.modified = false
                item.selected = true
                emit('selectItem', item)
            }
            else if (!item.selected) {
                item.modified = true
                item.selected = true
                emit('selectItem', item)
            }
        })
    } else {
        filteredItems.value.forEach(item => {
            if (item.modified) {
                item.modified = false
                item.selected = false
                emit('selectItem', item)
            }
            else if (item.selected) {
                item.modified = true
                item.selected = false
                emit('selectItem', item)
            }
        })
    }
}
</script>

<template>
    <div class="grid column" :style="{ flex: props.flex, height: props.height }">
        <header class="row g-4">
            <section class="left fill row center-inline g-4">
                <span v-if="title">{{ title }}</span>
                <div class="search" v-if="props.search">
                    <input type="search" placeholder="Search..." v-model="searchContent" >
                </div>
            </section>
            <section class="tools row g-1">
                <button v-if="props.tools?.includes('refresh') && !activeChanges" @click="$emit('refresh')">
                    <i class="fa-solid fa-rotate"></i>
                    <span>Refresh</span>
                </button>
                <slot name="tools" />
                <button v-if="props.tools?.includes('add')" @click="$emit('addItem')">
                    <i class="fa-solid fa-plus"></i>
                    <span>Add</span>
                </button>
                <button v-if="activeChanges" @click="cancelChanges">
                    <i class="fa-solid fa-ban"></i>
                    <span>Cancel</span>
                </button>
                <button v-if="props.tools?.includes('save') && activeChanges" @click="saveChanges">
                    <i class="fa-solid fa-floppy-disk"></i>
                    <span>Save</span>
                </button>
            </section>
        </header>
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th v-if="checkboxes" style="width: 1%">
                            <input type="checkbox" :checked="allSelected" @change="toggleSelectAll" />
                        </th>
                        <th class="column-header" v-for="column in columns" @click="sortBy(column.field)" :style="{ width: column.width, textAlign: column.textAlign }">
                            <span v-if="sortField === column.field">
                                <span>{{ column.label }}</span>
                                <i class="fa-solid fa-caret-down" v-if="sortType === 'asc'"></i>
                                <i class="fa-solid fa-caret-up" v-if="sortType === 'desc'"></i>
                            </span>
                            <span v-else>{{ column.label }}</span>
                        </th>
                        <th v-if="props.tools?.some(t => ['edit', 'delete'].includes(t))" style="width: 1%"></th>
                        
                    </tr>
                </thead>
                <tbody>
                    <tr id="item" v-for="item in pagedItems" :draggable="draggable" @dblclick="openItem(item)"
                        @dragstart="dragItem(item)" @drop="placeItem(item)" @dragover.prevent="" :class="{ 'new': item.new, 'modified': item.modified, 'deleted': item.deleted }">
                        
                        <td v-if="checkboxes">
                            <input type="checkbox" v-model="item.selected" @change="clickCheckbox(item)">
                        </td>
                        <td v-for="column in columns" :style="{ textAlign: column.textAlign, whiteSpace: column.wrap ?? 'nowrap' }">
                            <div class="td-editing" v-if="item.editing && column.editable">
                                <input :type="column.type ?? 'text'" :placeholder="column.placeholder"
                                       :style="{ textAlign: column.textAlign }" v-model="item[column.field]">
                            </div>
                            <div class="td-display" v-else>
                                <slot :name="column.field" v-bind="item">
                                    {{ column.format ? formatAs(column.format, item[column.field]) : item[column.field] }}
                                </slot>
                            </div>
                        </td>
                        <td class="row-tools" v-if="props.tools?.some(t => ['edit', 'delete'].includes(t))">
                            <div v-if="item.editing">
                                <i class="fa-solid fa-check" @click="saveItem(item)"></i>
                                <i class="fa-solid fa-ban" @click="resetItem(item)"></i>
                            </div>
                            <div v-else-if="item.deleted">
                                <i class="fa-solid fa-ban" @click="item.deleted = false"></i>
                            </div>
                            <div v-else>
                                <i class="fa-solid fa-pen-to-square" @click="editItem(item)" v-if="props.tools?.includes('edit')"></i>
                                <i class="fa-solid fa-trash-can" @click="removeItem(item)" v-if="props.tools?.includes('delete')"></i>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        <footer class="row g-2" v-if="pagination">
            <div class="pagination">
                <span @click="previousPage">
                    <i class="fa-solid fa-caret-left"></i>
                </span>
                <span v-for="page in pageCount()" @click="gotoPage(page)">
                    <p class="active-page" v-if="page === pageNumber">{{ page }}</p>
                    <p v-else>{{ page }}</p>
                </span>
                <span @click="nextPage">
                    <i class="fa-solid fa-caret-right"></i>
                </span>
            </div>
            <div class="items-per-page">
                <span><strong>{{ items.length }}</strong> items</span>
                <input v-model="itemsPerPage" size="1" min="10" v-focus-select>
            </div>
        </footer>
    </div>
</template>

<style scoped lang="scss">

td:not(.active-editing), th, header, footer {
    padding: 5px 10px !important;
}

div.grid {
    overflow-y: hidden;
    color: $dox-black-0;
}

header {
    align-items: center;
    justify-content: space-between;
    border: 1px solid $dox-white-1;
    border-bottom: 0;
    background-color: $dox-white-0;
}

section.left {
    span {
        padding: 0.25rem 0;
        font-weight: 800;
        font-size: 1.25rem;
    }

    .search {
        flex: 1 1;
        @include flex-h (0.25rem);
        
        input[type=search] {
            flex: 0 1 300px;
            padding: 0.25rem 0.5rem;
        }
        input[type=search]::-webkit-search-cancel-button:hover {
            cursor: pointer;
        }
    }
}

section.tools {
    button, :slotted(button) {
        user-select: none;
        padding: 0.25rem 0.5rem;
        font-size: 1.25rem;
        font-weight: 800;
        border-radius: 0.25rem;
        background-color: transparent;
    }

    button:hover, :slotted(button):hover {
        color: $dox-black-0;
        background-color: $dox-white-1;
    }
}

.table-container {
    flex: 1 1;
    margin: 0;
    overflow: auto;
    background-color: white;
}

table {
    width: 100%;
    // table-layout: fixed;
}

table, th {
    border: 1px solid $dox-white-1;
    border-collapse: collapse;
    
    td {
        border: 1px solid $dox-white-1;
    }

    tr:nth-child(even) {
        background-color: $dox-white-0;
    }

    thead {
        top: 0;
        position: sticky;
        box-shadow: inset 0  2px 0 $dox-white-1,
                    inset 0 -2px 0 $dox-white-1;
    }

    thead tr th {
        border-top: 0;
        background-color: $dox-white-0;
    }

    tbody tr, thead tr {
        td:first-child, th:first-child {
            border-left: 0;
        }
        td:last-child, th:last-child {
            border-right: 0;
        }
    }
}


.column-header {
    text-align: left;
    white-space: nowrap;
    
    i { margin-left: 0.25rem }
}

.td-editing {
    width: inherit;
    display: flex;
    align-items: stretch;

    input {
        flex: 1 1;
        width: 0px;
        vertical-align: middle;
        border: 0;
        border-radius: 0;
        background-color: aliceblue
    }

    input, input[type=text] {
        padding: 5px 10px;
    }

    input[type=date] {
        padding: 4px 10px;
    }
}

#item {
    td {
        vertical-align: top;
    }

    td:has(> div.td-editing) {
        padding: 0 !important;
    }

}

input[type=checkbox] {
    cursor: pointer;
    margin: 0 !important;
}

#item.modified {
    background-color: aliceblue;
}

#item.deleted {
    background-color: mistyrose;
}

#item.new {
    background-color: honeydew;
}

#item:hover {
    background-color: $dox-white-1;
}

.row-tools {
    div {
        @include flex-h (0.5rem);
        justify-content: center;
    }

    i {
        width: 20px;
        font-size: 1.25rem;
        text-align: center;
    }

    i:hover {
        cursor: pointer;
        color: $dox-black-3;
    }
}

footer {
    align-items: stretch;
    justify-content: space-between;
    white-space: nowrap;
    border: 1px solid $dox-white-1;
    background-color: $dox-white-0;
}

.pagination {
    @include flex-h (0.25rem);
    
    span {
        cursor: pointer;
        padding: 0.25rem 0.5rem;
        min-width: 12px;
        border-radius: 0.25rem;
        font-weight: 700;
        text-align: center;
    }

    span:has(.active-page), span:hover {
        background-color: $dox-white-1;
    }
}

.items-per-page {
    @include flex-h (1rem);
    justify-content: right;
    align-items: center;
    
    input:focus {
        outline: none;
    }

    input {
        padding: 0.25rem;
        text-align: center;
        font-family: inherit;
        font-weight: inherit;
        border: 1px solid $dox-white-1;
        border-radius: 0.25rem;
    }
}
</style>