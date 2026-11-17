import sharp, { type Metadata } from "sharp"
import type { MediaExtension } from "../../shared/types"

export type MediaCategory = "image" | "audio"

const extensionsByMime: Record<MediaCategory, Record<string, MediaExtension>> = {
    image: {
        "image/gif": "gif",
        "image/webp": "webp",
        "image/png": "png",
        "image/jpeg": "jpeg",
    },
    audio: {
        "audio/mpeg": "mp3",
    },
}

const mpeg1Layer3Bitrates = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0]
const mpeg2Layer3Bitrates = [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, 0]

export async function validateMediaContent(
    category: MediaCategory,
    declaredType: string,
    data: Buffer,
): Promise<MediaExtension> {
    const mimeType = declaredType.split(";", 1)[0]?.trim().toLowerCase()
    const expectedExtension = mimeType ? extensionsByMime[category][mimeType] : undefined
    if (!expectedExtension) {
        throw new Error(`Unsupported ${category} media type.`)
    }

    if (category === "image") {
        let metadata: Metadata
        try {
            metadata = await sharp(data, { animated: true }).metadata()
        }
        catch {
            throw new Error("Invalid image contents.")
        }

        if (metadata.format !== expectedExtension) {
            throw new Error("Image contents do not match the declared MIME type.")
        }
        return expectedExtension
    }

    if (!hasMpegLayer3Frame(data)) {
        throw new Error("Invalid MPEG audio contents.")
    }
    return expectedExtension
}

function hasMpegLayer3Frame(data: Buffer) {
    let offset = 0
    if (data[0] === 0x49 && data[1] === 0x44 && data[2] === 0x33) {
        if (data.length < 10 || data[3] === 0xff || data[4] === 0xff) {
            return false
        }

        const sizeBytes = data.subarray(6, 10)
        if (sizeBytes.some(byte => (byte & 0x80) !== 0)) {
            return false
        }

        const tagSize = (data[6]! << 21) | (data[7]! << 14) | (data[8]! << 7) | data[9]!
        offset = 10 + tagSize + ((data[5]! & 0x10) !== 0 ? 10 : 0)
    }

    if (data.length - offset < 4) {
        return false
    }

    const header = data.readUInt32BE(offset)
    if (((header >>> 21) & 0x7ff) !== 0x7ff) {
        return false
    }

    const version = (header >>> 19) & 0b11
    const layer = (header >>> 17) & 0b11
    const bitrateIndex = (header >>> 12) & 0b1111
    const sampleRateIndex = (header >>> 10) & 0b11
    if (version === 0b01 || layer !== 0b01 || bitrateIndex === 0 || bitrateIndex === 0b1111 || sampleRateIndex === 0b11) {
        return false
    }

    const bitrate = (version === 0b11 ? mpeg1Layer3Bitrates : mpeg2Layer3Bitrates)[bitrateIndex]!
    const sampleRates = version === 0b11
        ? [44_100, 48_000, 32_000]
        : version === 0b10
            ? [22_050, 24_000, 16_000]
            : [11_025, 12_000, 8_000]
    const frameLength = Math.floor((version === 0b11 ? 144 : 72) * bitrate * 1000 / sampleRates[sampleRateIndex]!)
        + ((header >>> 9) & 1)

    return frameLength >= 4 && offset + frameLength <= data.length
}
