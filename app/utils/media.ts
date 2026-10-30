import type { Image, Media } from "@@/shared/types"

export const calculateTokens = (file: File | null) => {
    if (!file) {
        return 0
    }
    else {
        return Math.round(file.size / 2_048)
    }
}

function packageFiles(file: File) {
    const data = new FormData()
    data.append(file.name, file)
    return data
}

type MediaType = "image" | "audio"

async function uploadMediaFile<T extends Media>(file: File | undefined, mediaType: MediaType) {
    const hints = useHints()
    const settings = useSettings()

    if (mediaType == "image" && !settings.app.media.images.enabled) {
        hints.addMessage("Image uploads are not enabled.")
        return
    }
    if (mediaType == "audio" && !settings.app.media.audio.enabled) {
        hints.addMessage("Audio uploads are not enabled.")
        return
    }
    
    if (!file) {
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

    const fileSize = file.size / 1_048_576
    if (fileSize > maxSize) {
        hints.addWarning(`File is ${fileSize}MB, the upload limit is ${maxSize}MB.`)
        return
    }

    try {
        const result = await useApi<{ media: T, tokens: number }>(`/api/${mediaType}/upload`, {
            body: packageFiles(file)
        })
        hints.addSuccess(`Uploaded file "${file.name}" [${result.tokens} tokens]`)
        return result.media
    }
    catch (error: any) {
        hints.addError(`Failed to upload file "${file.name}"`, error)
        return
    }
}

export const uploadMedia = async <T extends Media>(files: FileList, mediaType: MediaType) => {
    return uploadMediaFile<T>(files?.[0], mediaType)
}

export const uploadMediaBatch = async <T extends Media>(files: FileList, mediaType: MediaType) => {
    const uploaded: T[] = []
    for (const file of Array.from(files)) {
        const media = await uploadMediaFile<T>(file, mediaType)
        if (media) uploaded.push(media)
    }
    return uploaded
}

export function useImageUploader(storageKey: string) {
    const hints = useHints()
    const session = getSession()

    const { files, open: openFileDialog, reset: cancel } = useFileDialog({
        accept: "image/*",
        multiple: true,
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
            const results = await uploadMediaBatch<Image>(files.value, "image")
            uploaded.value.push(...results)
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