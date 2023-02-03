import { marked } from 'marked';

export function renderMarkdown(text: string | undefined) {
    return marked.parse(text ?? "");
}