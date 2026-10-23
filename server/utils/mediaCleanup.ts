import fs from "node:fs"
import path from "node:path"

type TrashItem = {
    id: string
    type: string
    extension: string
}

const allowedExtensions: Record<string, Set<string>> = {
    image: new Set(["gif", "webp", "png", "jpeg"]),
    audio: new Set(["mp3"]),
}

export async function trashImage(imageId: string) {
    await new DatabaseQuery()
        .addSql(`
            BEGIN TRANSACTION;
            LET $usages = SELECT VALUE id
                FROM post, thread, draft
                WHERE images CONTAINS $image;
            IF array::len($usages) > 0 {
                THROW "Image is still attached to content.";
            };
            LET $deletedImage = DELETE ONLY $image RETURN BEFORE;
            IF $deletedImage != NONE {
                UPDATE $deletedImage.user SET
                    tokens += $deletedImage.tokens;
                CREATE $media SET
                    type = "image",
                    extension = $deletedImage.type;
            };
            COMMIT TRANSACTION;
        `)
        .addRecord("media", `mediaTrash:${imageId}`)
        .addRecord("image", `image:${imageId}`)
        .execute()
}

export async function emptyTrash() {
    try {
        const trashItems = await new DatabaseQuery()
            .addSql(`
                SELECT id, type, extension, time
                FROM mediaTrash
                ORDER BY time ASC
                LIMIT 100;
            `)
            .queryAll<TrashItem>()

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

                const config = useRuntimeConfig()
                const mediaDirectory = path.resolve(config.data.path, media.type)
                const filePath = path.resolve(mediaDirectory, `${mediaId}.${media.extension}`)
                const relativePath = path.relative(mediaDirectory, filePath)
                if (relativePath === ".." || relativePath.startsWith(`..${path.sep}`) || path.isAbsolute(relativePath)) {
                    throw new Error("Invalid media cleanup path.")
                }

                await fs.promises.rm(filePath, { force: true })
                await new DatabaseQuery()
                    .addSql(`
                        DELETE ONLY $media;
                    `)
                    .addRecord("media", media.id)
                    .execute()
            }
            catch (error) {
                console.error(`Unable to remove pending media file ${media.id}.`, error)
            }
        }
    }
    catch (error) {
        console.error("Unable to load pending media cleanup records.", error)
    }
}