import fs from "node:fs"
import type { MultiPartData } from "h3"
import type { Audio } from "~/types"

// REFACTOR implement server-side token calculations
export async function processAudio(audio: MultiPartData): Promise<{ buffer: Buffer, type: string }> {
    return {
        type: "mp3",
        buffer: audio.data,
    }
}

// TODO add support for refund if failed
export async function writeAudio(audio: Audio, buffer: Buffer, type: string) {
    try {
        fs.writeFileSync(`./audio/${audio.id.split(':')[1]}.${type}`, buffer, {
            flag: "w+"
        })
    }
    catch (error: any) {
        throw createError({
            statusCode: 500,
            message: `Unable to upload audio...\n${error.message}`
        })
    }
}