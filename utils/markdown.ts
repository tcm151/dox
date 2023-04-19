import { marked } from 'marked'
import { decode } from 'html-entities';
import hljs from "highlight.js/lib/common";

hljs.configure({ ignoreUnescapedHTML: true })

export function renderMarkdown(text: string | undefined) {
    const html = marked.parse(text ?? "")
    const decoded = decode(html)
    const colorized = colorize(decoded)
    return colorized
}

function colorize(text: string) {
    let regex = /(?<=<pre><code class="(.*)">)(.*|\n)*(?=<\/code><\/pre>)/gm
    return text.replace(regex, (match) => hljs.highlightAuto(match).value)
}