import fs from "node:fs"
import sharp from "sharp"
import { MultiPartData } from "h3"
import { queryOne } from "~/server/database"
import { Image } from "~/types"

import { createResolver } from '@nuxt/kit'
const { resolve } = createResolver(import.meta.url);


export default defineEventHandler(async (event) => {
    // const auth = await authenticateRequest(event)
    // const data = await readMultipartFormData(event)
    // const baseUrl = getHeader(event, 'origin')

    // const { buffer, type } = await processImage(data![0])
    
    // const image = await queryOne<Image>([`
    //     CREATE image SET
    //     time = time::now(),
    //     type = "${type}",
    //     url = <future> { string::concat("${baseUrl}/image/", string::split(id, ":")[1]) },
    //     user = ${auth.id}
    // `])
    
    // await writeToDisk(image, buffer, type)
    // return image

    return process.cwd()
})

async function processImage(image: MultiPartData): Promise<{ buffer: Buffer, type: string }> {
    console.log(image.type)
    switch (image.type) {
        case "image/gif":
            return {
                buffer: await sharp(image.data, { animated: true }).gif().toBuffer(),
                type: "gif"
            }
        case "image/webp":
            return {
                buffer: await sharp(image.data).webp().toBuffer(),
                type: "webp"
            }
        case "image/png":
            return {
                buffer: await sharp(image.data).png({ compressionLevel: 9 }).toBuffer(),
                type: "png"
            }
        default:
            return {
                buffer: await sharp(image.data).jpeg({ mozjpeg: true, force: true }).toBuffer(),
                type: "webp"
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