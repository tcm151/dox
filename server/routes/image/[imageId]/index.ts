import fs from "node:fs"
import { queryOne } from "~/server/database"
import { Image } from "~/types"


export default defineEventHandler(async (event) => {
    const { imageId } = event.context.params!
    const image = await queryOne<Image>([`
        SELECT *
        FROM image:${imageId}
        FETCH user
    `])
    switch (process.env.NODE_ENV) {
        case "development":
            return fs.readFileSync(`./images/${imageId}.${image.type}`)
        case "production":
            return fs.readFileSync(`./.production/images/${imageId}.${image.type}`)
    }
})