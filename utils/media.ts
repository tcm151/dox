import type { Media } from "~/types"

export const calculateTokens = (file: File | null) => {
    if (!file) {
        return 0
    }
    else {
        return Math.round(file.size / 2_048)
    }
}

function packageFiles(files: FileList) {
    const data = new FormData()
    for (const file of files) {
        data.append(file.name, file)
    }
    return data
}

type MediaType = "image" | "audio"

export const uploadMedia = async <T extends Media>(files: FileList, mediaType: MediaType) => {
    const hints = useHints()
    const settings = useSettings()

    if (!files || !files[0]) {
        hints.addWarning("Please select a file.")
        return
    }
    // TODO account for all media types
    if (!settings.app.media.images.enabled) {
        hints.addError("Media uploads are currently disabled.")
        return
    }
    
    let maxSize = 0;
    if (mediaType === "image") {
        maxSize = settings.app.media.images.uploadLimit
    }
    if (mediaType === "audio") {
        maxSize = settings.app.media.audio.uploadLimit
    }

    const fileSize = files[0].size / 1_048_576
    if (fileSize > maxSize) {
        hints.addError(`File is ${fileSize}MB, the upload limit is ${maxSize}MB.`)
        return
    }

    try {
        const result = await useApi<{ media: T, tokens: number }>(`/api/${mediaType}/upload`, {
            body: packageFiles(files)
        })
        hints.addSuccess(`Uploaded file "${files[0].name}" [${result.tokens} tokens]`)
        return result.media
    }
    catch (error: any) {
        hints.addError(`Failed to upload file "${files[0].name}"`)
        return
    }
}