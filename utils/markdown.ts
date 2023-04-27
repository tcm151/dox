import { marked } from 'marked'
import { decode } from 'html-entities'
import hljs from "highlight.js/lib/common"

hljs.configure({ ignoreUnescapedHTML: true })

export function renderMarkdown(text: string | undefined) {
    const html = marked.parse(text ?? "")
    const decoded = decode(html)
    const colorized = colorize(decoded)
    return colorized
}

function colorize(text: string) {
    let regex = /(?<=<pre><code class="([A-Za-z0-9_-]*)">)((?!<pre>).|\n)*(?=<\/code><\/pre>)/gm
    return text.replace(regex, (match, language: string, _) =>  {
        const matchedLanguage = hljs.listLanguages().find(l => l == language.split('-')[1]) ?? 'plaintext'
        return hljs.highlight(match, { language: matchedLanguage }).value
    })
}