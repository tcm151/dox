import { parseFragment, type DefaultTreeAdapterTypes } from "parse5"
import { marked } from 'marked'
import DOMPurify from "isomorphic-dompurify"
import { decode } from 'html-entities'
import hljs from "highlight.js/lib/common"

DOMPurify.setConfig({
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['iframe'],
    KEEP_CONTENT: false,
})

hljs.configure({ ignoreUnescapedHTML: true })

export function renderMarkdown(text: string | undefined) {
    const html = marked.parse(text ?? "")
    const cleaned = DOMPurify.sanitize(html as string)
    const decoded = decode(cleaned)
    const colorized = colorize(decoded)
    return colorized
}

// TODO we need to remove tables from getting caught in here; also li, ol
export function renderMarkdownText(text: string | undefined) {
    const blockElements = new Set(["p", "h1", "h2", "h3", "h4", "h5", "h6", "li", "blockquote", "pre"])

    function extractText(node: DefaultTreeAdapterTypes.Node): string {
        if ("value" in node) return node.value
        if (node.nodeName === "br" || node.nodeName === "hr") return " "
        if (/^h[1-6]$/.test(node.nodeName)) return ""
        if (node.nodeName === "table") return ""
        if ("content" in node) return extractText(node.content)
        if (!("childNodes" in node)) return ""

        const content = node.childNodes.map(extractText).join("")
        return blockElements.has(node.nodeName) ? `${content} ` : content
    }

    return extractText(parseFragment(renderMarkdown(text)))
        .replace(/\[([^\]]+)\]\s*\[[^\]]*\]/g, "$1")
        .replace(/\s+/g, " ")
        .trim()
}

function colorize(text: string) {
    let regex = /(?<=<pre><code class="([A-Za-z0-9_-]*)">)((?!<pre>).|\n)*(?=<\/code><\/pre>)/gm
    return text.replace(regex, (match, language: string, _) =>  {
        const matchedLanguage = hljs.listLanguages().find(l => l == language.split('-')[1]) ?? 'plaintext'
        return hljs.highlight(match, { language: matchedLanguage }).value
    })
}