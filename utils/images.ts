import type { Image } from "~/types"

function packageFiles(files: FileList | null) {
    const data = new FormData()
    for (const file of files!) {
        data.append(file.name, file)
    }
    return data
}

export const calculateTokens = (file: File | null) => {
    if (!file) {
        return 0
    }
    else {
        return Math.round(file.size / 1_024)
    }
}

export const uploadImage = async (files: FileList | null) => {

    const hints = useHints()
    const session = getSession()
    
    if (!files || files.length == 0) {
        hints.addWarning("Please select an image.")
        return
    }
    
    const maxSize = 8
    const megabytes = files![0].size / 1_048_576

    if (megabytes > maxSize) {
        hints.addError(`${megabytes} MB`)
        hints.addError(`File is too large, try making it smaller (< ${maxSize}).`)
        return
    }

    const result = await session.useApi<{ image: Image, tokens: number }>("/api/image/upload", packageFiles(files))
    if (result == null) {
        hints.addError("Failed to upload image.")
        return
    }

    hints.addSuccess(`Uploaded file "${files[0].name}" [${result.tokens} tokens]`)
    return result.image
}