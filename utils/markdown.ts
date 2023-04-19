import { marked } from 'marked'
import { decode } from 'html-entities'
import sanitizeHtml, { IOptions } from "sanitize-html"
import hljs from "highlight.js/lib/common"

hljs.configure({ ignoreUnescapedHTML: true })

const sanitizationOptions: IOptions = {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([ 'img' ])
}

export function renderMarkdown(text: string | undefined) {
    const html = marked.parse(text ?? "")
    const sanitized = sanitizeHtml(html, sanitizationOptions)
    const decoded = decode(sanitized)
    const colorized = colorize(decoded)
    return colorized
}

function colorize(text: string) {
    let regex = /(?<=<pre><code class="([A-Za-z0-9_-]*)">)((?!<pre>).|\n)*(?=<\/code><\/pre>)/gm
    return text.replace(regex, (match) => hljs.highlightAuto(match).value)
}