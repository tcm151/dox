import fs from "node:fs"
import sharp from "sharp"
import type { H3Event, MultiPartData } from "h3"
import type { User, Media } from "@@/shared/types"

type MediaType = "image" | "audio"

export async function processMedia(event: H3Event, type: MediaType): Promise<{ buffer: Buffer, tokens: number, type: string }> {
    const media = await validateMedia(event, type)
    
    switch (media.type) {
        case "image/gif":
            return await handleGif(media)
        case "image/webp":
            return await handleWebp(media)
        case "image/png":
            return await handlePng(media)
        case "image/jpeg":
            return await handleJpeg(media)
        case "audio/mpeg": {
            return handleMpeg(media)
        }
        default:
            throw createError({
                status: 400,
                statusText: "Unsupported media type."
            })
    }
}

async function validateMedia(event: H3Event, type: MediaType): Promise<MultiPartData> {
    const data = await readMultipartFormData(event)
    const settings = await SettingsManager.get()

    if (type == "image" && !settings.media.images.enabled) {
        throw createError({
            status: 503,
            statusText: "Image uploads are currently disabled."
        })
    }
    if (type == "audio" && !settings.media.audio.enabled) {
        throw createError({
            status: 503,
            statusText: "Audio uploads are currently disabled."
        })
    }

    if (!data || !data[0]) {
        throw createError({
            status: 400,
            statusText: "You did pass any files to be uploaded."
        })
    }

    const fileSize = data[0].data.byteLength / 1_048_576

    if (type == "image" && fileSize > settings.media.images.uploadLimit) {
        throw createError({
            status: 400,
            statusText: `File size exceeds the ${settings.media.images.uploadLimit}MB limit.`
        })
    }
    if (type == "audio" && fileSize > settings.media.audio.uploadLimit) {
        throw createError({
            status: 400,
            statusText: `File size exceeds the ${settings.media.audio.uploadLimit}MB limit.`
        })
    }

    return data[0]
}

async function handleGif(media: MultiPartData) {
    const gif = await sharp(media.data, { animated: true }).gif().toBuffer()
    return {
        type: "gif",
        tokens: Math.round(gif.byteLength / 2_048),
        buffer: gif
    }
}

async function handleWebp(media: MultiPartData) {
    const webp = await sharp(media.data).webp().toBuffer()
    return {
        type: "webp",
        tokens: Math.round(webp.byteLength / 2_048),
        buffer: webp
    }
}

async function handlePng(media: MultiPartData) {
    const png = await sharp(media.data).png({ compressionLevel: 9 }).toBuffer()
    return {
        type: "png",
        tokens: Math.round(png.byteLength / 2_048),
        buffer: png
    }
}

async function handleJpeg(media: MultiPartData) {
    const jpeg = await sharp(media.data).jpeg({ quality: 80, force: true }).toBuffer()
    return {
        type: "jpeg",
        tokens: Math.round(jpeg.byteLength / 2_048),
        buffer: jpeg
    }
}

function handleMpeg(media: MultiPartData) {
    const mpeg = media.data
    return {
        type: "mp3",
        tokens: Math.round(mpeg.byteLength / 2_048),
        buffer: mpeg
    }
}

export async function writeMedia(user: User, media: Media, buffer: Buffer, type: MediaType) {
    try {
        const config = useRuntimeConfig()
        const basePath = `${config.data.path}/${type}`

        if (!fs.existsSync(basePath)) {
            fs.mkdirSync(basePath, { recursive: true })
        }
        fs.writeFileSync(`${basePath}/${extractId(media.id)}.${media.type}`, buffer, {
            flag: "w+"
        })  
    }
    catch (error: any) {
        await new DatabaseQuery()
            .addSql(`
                RETURN {
                    UPDATE $user SET
                        tokens += $media.tokens;
                    
                    DELETE $media;
                };
            `)
            .addRecord("media", media.id)
            .addRecord("user", user.id)
            .execute()

        throw createError({
            status: 500,
            statusText: 'Unable to save file on server.',
            message: error.message,
            stack: error.stack,
        })
    }
}