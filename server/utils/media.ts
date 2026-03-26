import fs from "node:fs"
import sharp from "sharp"
import type { MultiPartData } from "h3"
import type { User, Media } from "~/types"

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
                status: 400,
                statusText: "Unsupported media type."
            })
    }
}

type MediaType = "image" | "audio"

export async function writeMedia(user: User, media: Media, buffer: Buffer, mediaType: MediaType) {
    try {
        const basePath = (ENV.isDevelopment())
            ? `./media/${mediaType}`
            : `./.production/media/${mediaType}`

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
                    IF $media.user != $user AND $user.roles CONTAINSNOT "admin" {
                        THROW "You are not allowed to do this.";
                    };
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