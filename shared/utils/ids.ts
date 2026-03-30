export function extractId(id: string) {
    return id.toString().split(":").at(1)
}