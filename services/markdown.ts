import { marked } from 'marked'
import hljs from "highlight.js/lib/common";
import insane from "insane"

export function renderMarkdown(text: string | undefined) {
    let html = marked.parse(text ?? "")
    let sanitized = insane(html)
    return sanitized
    // return hljs.highlightAuto(sanitized).value
}