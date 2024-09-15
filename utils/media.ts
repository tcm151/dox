import type { Media } from "~/types"

export const calculateTokens = (file: File | null) => {
    if (!file) {
        return 0
    }
    else {
        return Math.round(file.size / 1_024)
    }
}

function packageFiles(files: FileList | null) {
    const data = new FormData()
    for (const file of files!) {
        data.append(file.name, file)
    }
    return data
}

type MediaType = "image" | "audio"

export const uploadMedia = async <T extends Media>(files: FileList | null, mediaType: MediaType) => {
    const hints = useHints()
    const session = getSession()
    
    if (files == null || files.length == 0) {
        hints.addWarning("Please select a file.")
        return
    }
    
    // const maxSize = 8
    // const megabytes = files![0].size / 1_048_576

    // if (megabytes > maxSize) {
    //     hints.addError(`${megabytes} MB`)
    //     hints.addError(`File is too large, try making it smaller (< ${maxSize}).`)
    //     return
    // }

    const result = await session.useApi<{ media: T, tokens: number }>(`/api/${mediaType}/upload`, packageFiles(files))
    if (result == null) {
        hints.addError(`Failed to upload file "${files[0].name}"`)
        return
    }
    else {
        hints.addSuccess(`Uploaded file "${files[0].name}" [${result.tokens} tokens]`)
        return result.media
    }
}