import { marked } from "marked";

// const heading: marked.RendererExtension = {
//     name: "heading",
//     renderer(token) {
//         const titleText = token.text.toLowerCase().trim()
//         let headingAnchor = titleText.replace(/[^A-Za-z]+/g, '-')
//         return `
//             <h${token.depth}>
//                 <a name=${headingAnchor} class="anchor" href="#${headingAnchor}">
//                     ${token.text}
//                 </a>
//             </h${token.depth}>
//         `
//     }
// }

const spoiler: marked.TokenizerExtension & marked.RendererExtension = {
    name: "spoiler",
    level: "inline",
    start(src) {
        return src.match(/\[\[/)?.index
    },
    tokenizer(src, tokens) {
        const match = /^\[\[([^\]]+)\]\]/.exec(src)
        if (match) {
            return {
                type: "spoiler",
                raw: match[0],
                text: this.lexer.inline(match[1].trim()) 
            }
        }
    },
    renderer(token) {
        return `<span class="spoiler" tabindex="0">${this.parser.parseInline(token.text)}</span>`
    }
}

export default defineNuxtPlugin((nuxtApp) => {  
    marked.use({
        extensions: [spoiler]
    })
})