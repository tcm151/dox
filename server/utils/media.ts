import fs from "node:fs"
import sharp from "sharp"
import type { MultiPartData } from "h3"
import type { Media } from "~/types"

// REFACTOR implement server-side token calculations
export async function processMedia(media: MultiPartData): Promise<{ buffer: Buffer, type: string }> {
    switch (media.type) {
        case "image/gif":
            return {
                type: "gif",
                buffer: await sharp(media.data, { animated: true }).gif().toBuffer(),
            }
        case "image/webp":
            return {
                type: "webp",
                buffer: await sharp(media.data).webp().toBuffer(),
            }
        case "image/png":
            return {
                type: "png",
                buffer: await sharp(media.data).png({ compressionLevel: 9 }).toBuffer(),
            }
        case "image/jpeg":
            return {
                buffer: await sharp(media.data).jpeg({ quality: 80, force: true }).toBuffer(),
                type: "jpeg"
            }
        case "audio/mpeg": {
            return {
                type: "mp3",
                buffer: media.data,
            }
        }
        default:
            throw createError({
                statusCode: 400,
                statusMessage: "Unsupported media type."
            })
    }
}

type MediaType = "image" | "audio"

export async function writeMedia(media: Media, buffer: Buffer, mediaType: MediaType) {
    try {
        fs.writeFileSync(`./media/${mediaType}/${extractId(media.id)}.${media.type}`, buffer, {
            flag: "w+"
        })
    }
    catch (error: any) {
        removeMediaFromDatabase(media)
        throw createError({
            statusCode: 500,
            statusMessage: 'Unable to save file on server.',
            message: error.message,
        })
    }
}

// TODO add support for refund if failed
async function removeMediaFromDatabase(media: Media) {
    var { sql, parameters } = queryBuilder()
    sql.push('DELETE $media')
    parameters['media'] = media.id
    await queryOne({ sql, parameters })
}