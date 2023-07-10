import { queryOne } from "~/server/database"
import { Image, User } from "~/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const data = await readMultipartFormData(event)
    const baseUrl = getHeader(event, 'origin')

    const { buffer, type } = await processImage(data![0])

    const kilobytes = Math.round(buffer.byteLength / 1_024)
    console.log(`${kilobytes} KB`)
    
    if (auth.tokens >= kilobytes) {
        await queryOne<User>([`
            UPDATE ${auth.id} SET
            tokens -= ${kilobytes}
        `])
    }
    else {
        throw createError({
            statusCode: 401,
            message: "You do not have enough tokens to upload this image."
        })
    }

    const image = await queryOne<Image>([`
        CREATE image SET
        time = time::now(),
        type = "${type}",
        url = <future> { string::concat("${baseUrl}/image/", string::split(id, ":")[1]) },
        user = ${auth.id}
    `])
    
    await writeToDisk(image, buffer, type)
    return image
})