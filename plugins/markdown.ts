import { marked } from "marked"
import type { TokenizerExtension, RendererExtension } from "marked"

const spoiler: TokenizerExtension & RendererExtension = {
    name: "spoiler",
    level: "inline",
    start(src) {
        return src.match(/\[\[/)?.index
    },
    tokenizer(src, tokens) {
        const match = /^\[\[([^\]]+)\]\]/.exec(src)
        if (match && match[1]) {
            return {
                type: "spoiler",
                raw: match[0],
                text: this.lexer.inline(match[1].trim()) 
            }
        }
    },
    renderer(token) {
        return `
            <span class="spoiler" tabindex="0">
                ${this.parser.parseInline(token.text)}
            </span>
        `
    },
}

/*
<[
Column 1: Info here
Column 2: More info
Column 3: Final info
]>
*/

const row: TokenizerExtension & RendererExtension = {
    name: "row",
    level: "block",
    start(src) {
        return src.match(/<\[/)?.index
    },
    tokenizer(src, tokens) {
        const match = /^<\[([\s\S]*?)\]>/.exec(src)
        if (match && match[1]) {
            let lines = match[1].trim().split("\n").filter(l => l.trim() != "")
            return {
                type: "row",
                raw: match[0],
                blocks: lines.map(l => this.lexer.blockTokens(l)),
            }
        }
    },
    renderer(token) {
        let html = ['<div class="row">']
        for (let i = 0; i < token.blocks.length; i++) {
            html.push(`${this.parser.parse(token.blocks[i])}`)
        }
        html.push('</div>')
        return html.join("");
    },
}

export default defineNuxtPlugin((nuxtApp) => {
    marked.use({
        extensions: [
            spoiler,
            row,
        ],
    })
})
