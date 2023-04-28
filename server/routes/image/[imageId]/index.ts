import fs from "node:fs"


export default defineEventHandler(async (event) => {
    const { imageId } = event.context.params!
    switch (process.env.NODE_ENV) {
        case "development":
            return fs.readFileSync(`./images/${imageId}.png`)
        case "production":
            return fs.readFileSync(`./.output/images/${imageId}.png`)
    }
})