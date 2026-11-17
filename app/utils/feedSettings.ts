import type { AppSettings } from "@@/shared/types"

export const feedSettingsByRoute: Partial<Record<string, keyof AppSettings["feeds"]>> = {
    "/feed/search": "search",
    "/feed/topics": "topics",
    "/feed/home": "discover",
    "/feed/posts": "posts",
    "/feed/links": "links",
    "/feed/threads": "threads",
    "/feed/gallery": "images",
    "/feed/audio": "audio",
}
