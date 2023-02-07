export const getId = (id: string | undefined) => {
    return id?.split(':')[1] ?? "null";
}