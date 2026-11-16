export function displayDeveloperValue(value: string | undefined) {
    return value?.trim() || "Unavailable"
}

export function displayBaseUrl(value: string | undefined) {
    if (!value?.trim()) return "Unavailable"

    try {
        const url = new URL(value.trim())
        if (url.protocol !== "http:" && url.protocol !== "https:") return "Unavailable"

        url.username = ""
        url.password = ""
        url.search = ""
        url.hash = ""
        return url.toString().replace(/\/$/, "")
    }
    catch {
        return "Unavailable"
    }
}
