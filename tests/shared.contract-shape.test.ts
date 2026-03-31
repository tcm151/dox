import type { AppSettings, Post, Thread, User } from "../shared/types"
import { describe, expect, it } from "vitest"

const userFixture: User = {
    id: "user:test",
    score: 0,
    votes: { positive: [], misleading: [], negative: [], awards: [], saves: [] },
    time: "2026-01-01T00:00:00Z",
    visits: 0,
    name: "tester",
    topics: [],
    followers: [],
    following: [],
    dateJoined: "2026-01-01T00:00:00Z",
    tokens: 0,
    roles: ["developer"],
    traits: [],
}

const postFixture: Post = {
    id: "post:test",
    score: 0,
    votes: { positive: [], misleading: [], negative: [], awards: [], saves: [] },
    time: "2026-01-01T00:00:00Z",
    visits: 0,
    user: "user:test" as User & string,
    title: "Post title",
    content: "Body",
    topics: [],
    comments: [],
    images: [],
    archived: false,
    edited: false,
}

const threadFixture: Thread = {
    id: "thread:test",
    score: 0,
    votes: { positive: [], misleading: [], negative: [], awards: [], saves: [] },
    time: "2026-01-01T00:00:00Z",
    visits: 0,
    user: "user:test" as User & string,
    content: "Thread body",
    topics: [],
    replies: [],
    images: [],
    archived: false,
    deleted: false,
    edited: false,
}

const settingsFixture: AppSettings = {
    id: "appSettings:default",
    email: { support: "", additional: "" },
    voting: { enabled: true, misleading: true, negative: true },
    topics: { enabled: true, perSubmission: 3, restrictTopics: false, allowList: [] },
    feeds: {
        search: true,
        discover: true,
        topics: true,
        posts: true,
        threads: true,
        images: true,
        audio: false,
        video: false,
    },
    posts: { enabled: true },
    threads: { enabled: true },
    media: {
        tokens: { enabled: false },
        images: { enabled: true, uploadLimit: 10 },
        audio: { enabled: false, uploadLimit: 100 },
        video: { enabled: false, uploadLimit: 500 },
    },
    misc: {
        feedback: {
            enabled: true,
            allowAnonymous: false,
        },
    },
}

describe("shared contract shape", () => {
    it("user fixture has required keys", () => {
        expect(userFixture).toHaveProperty("id")
        expect(userFixture).toHaveProperty("name")
        expect(userFixture).toHaveProperty("roles")
        expect(typeof userFixture.id).toBe("string")
        expect(typeof userFixture.name).toBe("string")
        expect(Array.isArray(userFixture.roles)).toBe(true)
    })

    it("post and thread fixtures have required keys", () => {
        expect(postFixture).toHaveProperty("title")
        expect(postFixture).toHaveProperty("content")
        expect(threadFixture).toHaveProperty("content")
        expect(threadFixture).toHaveProperty("replies")
        expect(typeof postFixture.title).toBe("string")
        expect(typeof threadFixture.content).toBe("string")
        expect(Array.isArray(postFixture.images)).toBe(true)
        expect(Array.isArray(threadFixture.replies)).toBe(true)
    })

    it("settings fixture contains expected top-level sections", () => {
        expect(settingsFixture).toHaveProperty("voting")
        expect(settingsFixture).toHaveProperty("topics")
        expect(settingsFixture).toHaveProperty("media")
        expect(settingsFixture).toHaveProperty("misc")
        expect(typeof settingsFixture.voting.enabled).toBe("boolean")
        expect(typeof settingsFixture.topics.perSubmission).toBe("number")
        expect(typeof settingsFixture.media.images.uploadLimit).toBe("number")
        expect(typeof settingsFixture.misc.feedback.allowAnonymous).toBe("boolean")
    })
})
