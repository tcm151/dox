export function extractId(id: string | undefined) {
    return id?.split(':')[1] ?? "null";
}