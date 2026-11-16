import { expect, it } from "vitest"
import { extractId } from "../../shared/utils/records"
import { expectStatus, fetch, grabExampleServer, grabUser } from "../utils/test-server"

const admin = await grabUser("admin")
const exampleServer = await grabExampleServer("default")
const member = exampleServer.users.sampleUser01

it("increments and returns visit counters for every supported target route", async () => {
    const suffix = Date.now().toString()
    const topic = `topic:visitTopic${suffix}`
    const post = `post:visitPost${suffix}`
    const thread = `thread:visitThread${suffix}`
    const gallery = `gallery:visitGallery${suffix}`
    const link = `link:visitLink${suffix}`
    const userVisitsBefore = await admin.query<Array<Array<{ visits: number }>>>(`SELECT visits FROM ${member.user.id};`)
    const originalUserVisits = userVisitsBefore[0]?.[0]?.visits
    expect(originalUserVisits).toBeDefined()

    const targets = [
        { record: member.user.id, path: `/api/user/${extractId(member.user.id)}/visit` },
        { record: topic, path: `/api/topic/${extractId(topic)}/visit` },
        { record: post, path: `/api/post/${extractId(post)}/visit` },
        { record: thread, path: `/api/thread/${extractId(thread)}/visit` },
        { record: gallery, path: `/api/gallery/${extractId(gallery)}/visit` },
        { record: link, path: `/api/link/${extractId(link)}/visit` },
    ]

    try {
        await admin.query(`
            CREATE ONLY ${topic};
            CREATE ONLY ${post} SET user = ${admin.user.id}, title = "Visit post ${suffix}", content = "Visit counter test";
            CREATE ONLY ${thread} SET user = ${admin.user.id}, content = "Visit counter test";
            CREATE ONLY ${gallery} SET user = ${admin.user.id}, title = "Visit gallery ${suffix}", description = "";
            CREATE ONLY ${link} SET user = ${admin.user.id}, title = "Visit link ${suffix}", url = "https://example.invalid/${suffix}";
        `)

        for (const target of targets) {
            const before = await admin.query<Array<Array<{ visits: number }>>>(`SELECT visits FROM ${target.record};`)
            const response = await fetch(target.path)
            expectStatus(response, 200, target.path)
            expect(await response.json()).toBe(before[0]?.[0]?.visits + 1)
        }
    }
    finally {
        await admin.query(`
            UPDATE ${member.user.id} SET visits = ${originalUserVisits};
            DELETE ${topic};
            DELETE ${post};
            DELETE ${thread};
            DELETE ${gallery};
            DELETE ${link};
        `)
    }
})