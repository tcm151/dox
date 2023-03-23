import { marked } from 'marked'
import hljs from "highlight.js/lib/common";

hljs.configure({ ignoreUnescapedHTML: true })

export function renderMarkdown(text: string | undefined) {
    const html = marked.parse(text ?? "")
    const colorized = colorize(html)
    const decoded = decodeHtml(colorized)
    return decoded
}

function colorize(text: string) {
    let regex = /(?<=<pre><code class="(.*)">)(.*|\n)*(?=<\/code><\/pre>)/gm
    return text.replace(regex, (match) => hljs.highlightAuto(match).value)
}

function decodeHtml(html: string) {
    var textArea = document.createElement('textarea');
    textArea.innerHTML = html;
    return textArea.value;
}