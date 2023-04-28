import fs from "node:fs"


export default defineEventHandler(async (event) => {
    const { imageId } = event.context.params!
    try {
        switch (process.env.NODE_ENV) {
            case "development":
                fs.rmSync(`./images/${imageId}.png`)
                return true
            case "production":
                fs.rmSync(`./.output/images/${imageId}.png`)
                return true
        }
    }
    catch (error) {
        return false
    }
})