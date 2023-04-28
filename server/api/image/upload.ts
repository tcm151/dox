import fs from "node:fs"
import sharp from "sharp"
import { authenticateRequest, queryOne } from "~/server/database"
import { Image } from "~/types"


export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const data = await readMultipartFormData(event)
    const baseUrl = getHeader(event, 'origin')
    const image = await queryOne<Image>([`
        CREATE image SET
        url = <future> { string::concat("${baseUrl}/image/", string::split(id, ":")[1]) },
        user = ${auth.id},
        time = time::now()
    `])
    const png = await sharp(data![0].data).png().toBuffer()
    switch (process.env.NODE_ENV) {
        case "development":
            fs.writeFileSync(`./images/${image.id.split(':')[1]}.png`, png, {
                flag: "w+"
            })
            break
        case "production":
            fs.writeFileSync(`./.output/images/${image.id.split(':')[1]}.png`, png, {
                flag: "w+"
            })
            break
    }
    return image
})