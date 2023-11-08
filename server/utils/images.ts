import fs from "node:fs"
import sharp from "sharp"
import type { MultiPartData } from "h3"
import type { Image } from "~/types"

// REFACTOR implement server-side token calculations
export async function processImage(image: MultiPartData): Promise<{ buffer: Buffer, type: string }> {
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
                buffer: await sharp(image.data).jpeg({ quality: 80, force: true }).toBuffer(),
                type: "jpeg"
            }
    }
}

// TODO add support for refund if failed
export async function writeToDisk(image: Image, buffer: Buffer, type: string) {
    try {
        fs.writeFileSync(`./images/${image.id.split(':')[1]}.${type}`, buffer, {
            flag: "w+"
        })
    }
    catch (error: any) {
        throw createError({
            statusCode: 500,
            message: `Unable to upload image...\n${error.message}`
        })
    }
}