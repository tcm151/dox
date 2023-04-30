import fs from "node:fs"
import sharp from "sharp"
import { MultiPartData } from "h3"
import { authenticateRequest, queryOne } from "~/server/database"
import { Image } from "~/types"


export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const data = await readMultipartFormData(event)
    const baseUrl = getHeader(event, 'origin')
    const image = await queryOne<Image>([`
        CREATE image SET
        time = time::now(),
        url = <future> { string::concat("${baseUrl}/image/", string::split(id, ":")[1]) },
        user = ${auth.id},
    `])

    const buffer = await processImage(data![0])
    switch (process.env.NODE_ENV) {
        case "development":
            fs.writeFileSync(`./images/${image.id.split(':')[1]}.png`, buffer, {
                flag: "w+"
            })
            break
        case "production":
            fs.writeFileSync(`./.production/images/${image.id.split(':')[1]}.png`, buffer, {
                flag: "w+"
            })
            break
    }
    return image
})

async function processImage(image: MultiPartData) {
    switch (image.type) {
        default:
            return await sharp(image.data).png().toBuffer()
    }
}