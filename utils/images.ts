import { Image } from "~/types"

function packageFiles(files: FileList | null) {
    const data = new FormData()
    for (const file of files!) {
        data.append(file.name, file)
    }
    return data
}

export const uploadImage = async (files: FileList | null) =>  {

    const hints = useHints()
    const session = getSession()
    
    if (!files || files.length == 0) {
        hints.addWarning("Please select an image.")
        return
    }
    
    const megabytes = files![0].size / 1_048_576
    if (megabytes > 32) {
        hints.addError(`${megabytes} MB`)
        hints.addError("File is too large, try making it smaller.")
        return
    }

    // uploading.value = true
    const image = await session.useApi<Image>("/api/image/upload", packageFiles(files))
    hints.addSuccess(`Uploaded file "${files[0].name}" [${megabytes.toFixed(3)} MB]`)
    // uploading.value = false
    return image
}