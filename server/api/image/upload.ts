import fs from "node:fs"
import sharp from "sharp"
import { MultiPartData } from "h3"
import { authenticateRequest, queryOne } from "~/server/database"
import { Image } from "~/types"


export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const data = await readMultipartFormData(event)
    const baseUrl = getHeader(event, 'origin')

    const { buffer, type } = await processImage(data![0])
    
    console.log(type)

    const image = await queryOne<Image>([`
        CREATE image SET
        time = time::now(),
        type = "${type}",
        url = <future> { string::concat("${baseUrl}/image/", string::split(id, ":")[1]) },
        user = ${auth.id}
    `])
    
    await writeToDisk(image, buffer, type)
    return image
})

async function processImage(image: MultiPartData): Promise<{ buffer: Buffer, type: string }> {
    switch (image.type) {
        case "image/gif":
            return {
                buffer: await sharp(image.data, { animated: true }).gif().toBuffer(),
                type: "gif"
            }
        default:
            return {
                buffer: await sharp(image.data).png().toBuffer(),
                type: "png"
            }
    }
}

async function writeToDisk(image: Image, buffer: Buffer, type: string) {
    switch (process.env.NODE_ENV) {
        case "development":
            fs.writeFileSync(`./images/${image.id.split(':')[1]}.${type}`, buffer, {
                flag: "w+"
            })
            break
        case "production":
            fs.writeFileSync(`./.production/images/${image.id.split(':')[1]}.${type}`, buffer, {
                flag: "w+"
            })
            break
    }
}