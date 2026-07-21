import type { Image, Media } from "@@/shared/types"

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

    if (mediaType == "image" && !settings.app.media.images.enabled) {
        hints.addError("Image uploads are not enabled.")
        return
    }
    if (mediaType == "audio" && !settings.app.media.audio.enabled) {
        hints.addError("Audio uploads are not enabled.")
        return
    }
    
    if (!files || !files[0]) {
        hints.addWarning("Please select a file.")
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

export function useImageUploader(storageKey: string) {
    const hints = useHints()
    const session = getSession()

    const { files, open: openFileDialog, reset: cancel } = useFileDialog({
        accept: "image/*"
    })

    const uploading = ref<boolean>(false)
    const uploaded = useSessionStorage<Image[]>(storageKey, [])

    function select() {
        if (!hasTrait(session.user, "confirmed")) {
            hints.addWarning("You must confirm your account before uploading images.")
            return
        }
        openFileDialog()
    }

    async function upload() {
        if (!files.value) {
            hints.addWarning("Please select an image.")
            return
        }

        uploading.value = true
        try {
            const image = await uploadMedia<Image>(files.value, "image")
            if (image != null) {
                uploaded.value.push(image)
            }
        }
        finally {
            uploading.value = false
            cancel()
        }
    }


    async function remove(image: Image) {
        await useApi(`/api/image/${extractId(image.id)}/delete`)
        uploaded.value = uploaded.value.filter(i => i !== image)
        hints.addSuccess(`You have been refunded ${image.tokens} tokens.`)
    }

    function copy(event: Event) {
        let imageUrl = (event.target as HTMLImageElement).currentSrc
        navigator.clipboard.writeText(`![](${imageUrl})`)
        hints.addSuccess("Copied image in markdown syntax.")
    }

    return reactive({
        files,
        uploading,
        uploaded,
        select,
        upload,
        cancel,
        remove,
        copy,
    })
}