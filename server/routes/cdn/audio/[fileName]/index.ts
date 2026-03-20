import fs from "node:fs"
import type { Audio } from "~/types"


export default defineEventHandler(async (event) => {
    const { fileName } = event.context.params!
    const id = fileName?.split('.').at(0)

    var { sql, parameters } = queryBuilder()
    sql.push('SELECT *')
    sql.push('FROM <record>$audio')
    sql.push('FETCH user')
    parameters['audio'] = `audio:${id}`
    const audio = await queryOne<Audio>({ sql, parameters })
    
    try {
        return fs.readFileSync(`./media/audio/${id}.${audio.type}`)
    }
    catch (error: any) {
        throw createError({
            statusCode: 500,
            message: `Unable to find audio:${id}...\n${error.message}`
        })
    }
})