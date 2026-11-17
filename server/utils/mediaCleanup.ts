import fs from "node:fs"
import path from "node:path"
import type { MediaExtension } from "../../shared/types"
import { extractId } from "../../shared/utils/records"

export type MediaTrashItem = {
    id: string
    type: "image" | "audio"
    extension: MediaExtension
    time: string
}

const mediaExtensions = ["gif", "webp", "png", "jpeg", "mp3"]
const allowedExtensions: Record<string, Set<string>> = {
    image: new Set(mediaExtensions),
    audio: new Set(mediaExtensions),
}

export async function trashImage(imageId: string) {
    await new DatabaseQuery()
        .addSql(`
            LET $usages = (
                SELECT VALUE id
                FROM post, thread, draft, gallery
                WHERE images CONTAINS $image
            );
            IF $usages.len() > 0 {
                fn::http(409, "Image is still attached to content.");
            };
            LET $deletedImage = (
                DELETE ONLY $image RETURN BEFORE
            );
            IF $deletedImage != NONE {
                UPDATE $deletedImage.user SET
                    tokens += $deletedImage.tokens;
                CREATE $media SET
                    type = "image",
                    extension = $deletedImage.type;
            };
        `)
        .addTransaction()
        .addRecord("media", `mediaTrash:${imageId}`)
        .addRecord("image", `image:${imageId}`)
        .execute()
}

export async function processMediaTrashBatch(trashItems: MediaTrashItem[],dataPath: string) {
    for (const media of trashItems) {
        try {
            const mediaId = extractId(media.id)
            const extensions = allowedExtensions[media.type]
            if (!extensions || !mediaId || !/^[a-zA-Z0-9_-]+$/.test(mediaId)) {
                throw new Error("Invalid media cleanup record.")
            }
            if (!extensions.has(media.extension)) {
                throw new Error(`Unsupported ${media.type} extension: ${media.extension}`)
            }

            const mediaDirectory = path.resolve(dataPath, media.type)
            const filePath = path.resolve(mediaDirectory, `${mediaId}.${media.extension}`)
            const relativePath = path.relative(mediaDirectory, filePath)
            if (relativePath === ".." || relativePath.startsWith(`..${path.sep}`) || path.isAbsolute(relativePath)) {
                throw new Error("Invalid media cleanup path.")
            }

            await fs.promises.rm(filePath, { force: true })
            await new DatabaseQuery()
                .addSql("DELETE ONLY $media;")
                .addRecord("media", media.id)
                .execute()
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error)
            console.error(`Unable to remove pending media file ${media.id}.`, error)
            try {
                await new DatabaseQuery()
                    .addSql(`
                        UPDATE ONLY $media SET
                            attempts += 1,
                            lastError = $error,
                            retryAfter = time::now() + 10m;
                    `)
                    .addRecord("media", media.id)
                    .addParameter("error", message.slice(0, 1024))
                    .execute()
            }
            catch (recordError) {
                console.error(`Unable to record cleanup failure for ${media.id}.`, recordError)
            }
        }
    }
}

export async function emptyTrash() {
    try {
        const trashItems = await new DatabaseQuery()
            .addSql(`
                SELECT id, type, extension, time
                FROM mediaTrash
                WHERE retryAfter = NONE OR retryAfter <= time::now()
                ORDER BY time ASC, id ASC
                LIMIT 100;
            `)
            .queryAll<MediaTrashItem>()

        const config = useRuntimeConfig()
        await processMediaTrashBatch(trashItems, config.data.path)
    }
    catch (error) {
        console.error("Unable to load pending media cleanup records.", error)
    }
}