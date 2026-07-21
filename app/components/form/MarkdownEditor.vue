<script setup lang="ts">
type Tool = {
    label: string
    icon?: string
    text?: string
    title: string
    action: () => void
}

type Cursor = {
    value: string
    start: number
    end: number
    selection: string
    line: {
        start: number
        end: number
    }
}

defineProps<{
    label?: string
    rows?: number
    placeholder?: string
    disabled?: boolean
    spellcheck?: boolean
    bounded?: boolean
}>()

const content = defineModel<string>({ default: "" })
const textarea = useTemplateRef<HTMLTextAreaElement>("textarea")

const tools: Tool[] = [
    { label: "Bold", icon: "fa-bold", title: "Bold", action: applyBold },
    { label: "Italic", icon: "fa-italic", title: "Italic", action: applyItalic },
    { label: "Strikethrough", icon: "fa-strikethrough", title: "Strikethrough", action: applyStrikethrough },
    { label: "Code", icon: "fa-code", title: "Inline code", action: applyInlineCode },
    { label: "Spoiler", icon: "fa-eye-slash", title: "Spoiler", action: applySpoiler },
    { label: "Heading 1", text: "H1", title: "Heading 1", action: () => applyHeading(1) },
    { label: "Heading 2", text: "H2", title: "Heading 2", action: () => applyHeading(2) },
    { label: "Heading 3", text: "H3", title: "Heading 3", action: () => applyHeading(3) },
    { label: "Quote", icon: "fa-quote-right", title: "Quote", action: applyQuote },
    { label: "Codeblock", icon: "fa-file-code", title: "Codeblock", action: applyCodeBlock },
    { label: "Bulleted list", icon: "fa-list-ul", title: "Bulleted list", action: applyBulletedList },
    { label: "Numbered list", icon: "fa-list-ol", title: "Numbered list", action: applyNumberedList },
    { label: "Link", icon: "fa-link", title: "Link", action: applyLink },
    { label: "Image", icon: "fa-image", title: "Image", action: applyImage },
    { label: "Row", icon: "fa-table-columns", title: "Row", action: applyRow },
    { label: "Horizontal rule", icon: "fa-minus", title: "Horizontal rule", action: applyHorizontalRule },
]

function getCursor(): Cursor {
    const value = content.value ?? ""
    const start = textarea.value?.selectionStart ?? value.length
    const end = textarea.value?.selectionEnd ?? value.length
    const nextLineBreak = value.indexOf("\n", end)

    return {
        value, start, end,
        selection: value.slice(start, end),
        line: {
            start: value.lastIndexOf("\n", Math.max(0, start - 1)) + 1,
            end: nextLineBreak === -1 ? value.length : nextLineBreak,
        },
    }
}

function replaceText(replaceStart: number, replaceEnd: number, replacement: string, nextStart: number, nextEnd = nextStart) {
    const value = content.value ?? ""
    content.value = `${value.slice(0, replaceStart)}${replacement}${value.slice(replaceEnd)}`
    queueMicrotask(() => {
        textarea.value?.focus()
        textarea.value?.setSelectionRange(nextStart, nextEnd)
    })
}

function togglePrefix(placeholder: string, transformation: (lines: string[]) => string[]) {
    const cursor = getCursor()
    const selection = cursor.value.slice(cursor.line.start, cursor.line.end) || placeholder
    const replacement = transformation(selection.split("\n")).join("\n")
    replaceText(cursor.line.start, cursor.line.end, replacement, cursor.line.start, cursor.line.start + replacement.length)
}

function toggleWrapper(prefix: string, suffix: string, placeholder: string) {
    const c = getCursor()
    const selectedIsWrapped = c.selection.startsWith(prefix)
        && c.selection.endsWith(suffix)
        && c.selection.length > prefix.length + suffix.length

    if (selectedIsWrapped) {
        const inner = c.selection.slice(prefix.length, c.selection.length - suffix.length)
        replaceText(c.start, c.end, inner, c.start, c.start + inner.length)
        return
    }

    const before = c.value.slice(c.start - prefix.length, c.start)
    const after = c.value.slice(c.end, c.end + suffix.length)

    if (c.start >= prefix.length && before === prefix && after === suffix) {
        const unwrappedStart = c.start - prefix.length
        replaceText(unwrappedStart, c.end + suffix.length, c.selection, unwrappedStart, unwrappedStart + c.selection.length)
        return
    }

    const inner = c.selection || placeholder
    const replacement = `${prefix}${inner}${suffix}`
    const innerStart = c.start + prefix.length
    replaceText(c.start, c.end, replacement, innerStart, innerStart + inner.length)
}

function applyBold() {
    toggleWrapper("**", "**", "bold text")
}

function applyItalic() {
    toggleWrapper("*", "*", "italic text")
}

function applyStrikethrough() {
    toggleWrapper("~~", "~~", "struck text")
}

function applyInlineCode() {
    toggleWrapper("`", "`", "code")
}

function applySpoiler() {
    toggleWrapper("[[", "]]", "spoiler text")
}

function applyQuote() {
    togglePrefix("Quote", (lines) => {
        const isQuoted = lines.every(line => line.startsWith("> ") || line.trim() === "")
        return lines.map(line => isQuoted ? line.replace("> ", "") : `> ${line || "Quote"}`)
    })
}

function applyBulletedList() {
    togglePrefix("List item", (lines) => {
        const isBulleted = lines.every(line => line.startsWith("- ") || line.trim() === "")
        return lines.map(line => isBulleted ? line.replace("- ", "") : `- ${line || "List item"}`)
    })
}

function applyHeading(level: number) {
    const marker = `${"#".repeat(level)} `
    togglePrefix(`Heading ${level}`, (lines) => {
        return lines.map(line => line.startsWith(marker) ? line.replace(/^#{1,6}\s/, "") : `${marker}${line.replace(/^#{1,6}\s/, "") || `Heading ${level}`}`)
    })
}

function applyNumberedList() {
    togglePrefix("List item", (lines) => {
        const isNumbered = lines.every(line => /^\d+\.\s/.test(line) || line.trim() === "")
        return lines.map((line, index) => isNumbered ? line.replace(/^\d+\.\s/, "") : `${index + 1}. ${line || "List item"}`)
    })
}

function applyCodeBlock() {
    const cursor = getCursor()
    const leadingBreak = cursor.start > 0 && cursor.value[cursor.start - 1] !== "\n" ? "\n" : ""
    const trailingBreak = cursor.end < cursor.value.length && cursor.value[cursor.end] !== "\n" ? "\n" : ""
    const inner = cursor.selection || "code"
    const replacement = `${leadingBreak}\`\`\`\n${inner}\n\`\`\`${trailingBreak}`
    const codeStart = cursor.start + leadingBreak.length + 4
    replaceText(cursor.start, cursor.end, replacement, codeStart, codeStart + inner.length)
}

function applyLink() {
    const cursor = getCursor()
    const label = cursor.selection || "link text"
    const url = "https://example.com"
    const replacement = `[${label}](${url})`
    const urlStart = cursor.start + label.length + 3
    replaceText(cursor.start, cursor.end, replacement, urlStart, urlStart + url.length)
}

function applyImage() {
    const cursor = getCursor()
    const alt = cursor.selection || "image description"
    const url = "https://example.com/image.png"
    const replacement = `![${alt}](${url})`
    const urlStart = cursor.start + alt.length + 4
    replaceText(cursor.start, cursor.end, replacement, urlStart, urlStart + url.length)
}

function applyHorizontalRule() {
    const cursor = getCursor()
    const leadingBreak = cursor.start > 0 && cursor.value[cursor.start - 1] !== "\n" ? "\n" : ""
    const trailingBreak = cursor.end < cursor.value.length && cursor.value[cursor.end] !== "\n" ? "\n" : ""
    const replacement = `${leadingBreak}---${trailingBreak}`
    const ruleEnd = cursor.start + leadingBreak.length + 3
    replaceText(cursor.start, cursor.end, replacement, ruleEnd)
}

function applyRow() {
    const cursor = getCursor()
    const leadingBreak = cursor.start > 0 && cursor.value[cursor.start - 1] !== "\n" ? "\n" : ""
    const trailingBreak = cursor.end < cursor.value.length && cursor.value[cursor.end] !== "\n" ? "\n" : ""
    const inner = cursor.selection || "Column 1: Info here\nColumn 2: More info"
    const replacement = `${leadingBreak}<[\n${inner}\n]>${trailingBreak}`
    const rowStart = cursor.start + leadingBreak.length + 3
    replaceText(cursor.start, cursor.end, replacement, rowStart, rowStart + inner.length)
}

function handleKeydown(event: KeyboardEvent) {
    if (!event.metaKey && !event.ctrlKey) return

    if (event.key.toLowerCase() === "b") {
        event.preventDefault()
        applyBold()
    }
    else if (event.key.toLowerCase() === "i") {
        event.preventDefault()
        applyItalic()
    }
    else if (event.key.toLowerCase() === "k") {
        event.preventDefault()
        applyLink()
    }
}
</script>

<template>
    <div class="field markdown-editor" :class="{ bounded }">
        <label v-if="label">{{ label }}</label>
        <header class="toolbar row inline wrap g-1 p-1">
            <button
                v-for="tool in tools"
                :key="tool.label"
                type="button"
                class="tool small p-0"
                :title="tool.title"
                :aria-label="tool.title"
                :disabled="disabled"
                @mousedown.prevent
                @click.prevent="tool.action"
            >
                <i v-if="tool.icon" class="fa-solid" :class="tool.icon"></i>
                <span v-if="tool.text">{{ tool.text }}</span>
            </button>
        </header>
        <textarea
            ref="textarea"
            :rows="rows ?? 8"
            :placeholder="placeholder"
            :disabled="disabled"
            :spellcheck="spellcheck ?? true"
            v-model="content"
            @keydown="handleKeydown"
        />
    </div>
</template>

<style scoped lang="scss">
div.markdown-editor {
    min-height: 0;

    header.toolbar {
        overflow-x: auto;
        width: stretch;
        box-sizing: border-box;
        background-color: $white-2;
        border-radius: 0.25rem 0.25rem 0 0;
    }

    button.tool {
        display: grid;
        place-items: center;
        flex: 0 0 2rem;
        width: 2rem;
        height: 2rem;

        i {
            font-size: 1rem;
        }

        span {
            font-size: 0.75rem;
            font-weight: 800;
            line-height: 1rem;
        }
    }

    textarea {
        border-top-left-radius: 0;
        border-top-right-radius: 0;
    }
}

div.markdown-editor.bounded {
    flex: 1 1 auto;
    min-height: 0;

    label, header.toolbar {
        flex: 0 0 auto;
    }

    textarea {
        flex: 1 1 auto;
        min-height: 0;
        overflow-y: auto;
        resize: none;
    }
}
</style>