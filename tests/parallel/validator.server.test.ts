import { afterAll, expect, it, vi } from "vitest"
import { Validator } from "../../shared/utils/Validator"
import { useValidation } from "../../shared/utils/validation"

vi.stubGlobal("createError", ({ message }: { message: string }) => new Error(message))
afterAll(() => vi.unstubAllGlobals())

it("skips validation for omitted optional values", () => {
    let called = false

    new Validator("OptionalInput")
        .optional(undefined, () => { called = true })
        .confirm()

    expect(called).toBe(false)
})

it("validates provided optional values", () => {
    const validated: string[] = []

    new Validator("OptionalInput")
        .optional("provided", (v, value) => {
            validated.push(value)
            v.string(value, "field")
        })
        .confirm()

    expect(validated).toEqual(["provided"])
})

it("does not treat null as an omitted optional value", () => {
    let validated: unknown

    new Validator("OptionalInput")
        .optional(null, (_v, value) => { validated = value })
        .confirm()

    expect(validated).toBeNull()
})

it("validates string length bounds", () => {
    new Validator("StringInput")
        .string("title", "title", { minLength: 4, maxLength: 5 })
        .confirm()

    expect(() => new Validator("StringInput")
        .string("x", "title", { minLength: 4 })
        .confirm()).toThrow()
})

it("enforces post title length boundaries", () => {
    new Validator("PostInput")
        .match("Four", "post.title")
        .match("L".repeat(128), "post.title")
        .confirm()

    expect(() => new Validator("PostInput")
        .match("abc", "post.title")
        .confirm()).toThrow()

    expect(() => new Validator("PostInput")
        .match("L".repeat(129), "post.title")
        .confirm()).toThrow()

    const validTitle = useValidation().post.title
    expect(validTitle("Four")).toBe(true)
    expect(validTitle("L".repeat(128))).toBe(true)
    expect(validTitle("abc")).toBe(false)
    expect(validTitle("L".repeat(129))).toBe(false)
})

it("validates allowed values", () => {
    new Validator("EnumInput")
        .in("mask", "visibility", ["show", "mask", "filter"])
        .confirm()

    expect(() => new Validator("EnumInput")
        .in("invalid", "visibility", ["show", "mask", "filter"])
        .confirm()).toThrow()
})

it("validates array length bounds", () => {
    new Validator("ArrayInput")
        .array(["topic:general"], "topics", undefined, { minLength: 1 })
        .confirm()

    expect(() => new Validator("ArrayInput")
        .array([], "topics", undefined, { minLength: 1 })
        .confirm()).toThrow()
})

it("rejects empty arrays in a validation chain", () => {
    new Validator("ArrayInput")
        .array(["topic:general"], "topics")
        .notEmpty(["topic:general"], "topics")
        .confirm()

    expect(() => new Validator("ArrayInput")
        .array([], "topics")
        .notEmpty([], "topics")
        .confirm()).toThrow()
})

it("validates URL protocols and length", () => {
    new Validator("UrlInput")
        .url("https://example.com", "url", { protocols: ["http:", "https:"], maxLength: 32 })
        .confirm()

    expect(() => new Validator("UrlInput")
        .url("ftp://example.com", "url", { protocols: ["http:", "https:"], maxLength: 32 })
        .confirm()).toThrow()
})

it("validates custom regular expressions", () => {
    new Validator("PatternInput")
        .regex("Valid title", /^[A-Z][a-z ]+$/, "title")
        .confirm()

    expect(() => new Validator("PatternInput")
        .regex("invalid title", /^[A-Z][a-z ]+$/, "title")
        .confirm()).toThrow("title: must match the required pattern")

    expect(() => new Validator("PatternInput")
        .regex(42, /.*/, "title")
        .confirm()).toThrow("title: must match the required pattern")
})

it("validates array item types and patterns with scoped paths", () => {
    new Validator("PatternInput")
        .array(["topic:general", "topic:links"], "topics", (v, topic) => {
            v.string(topic)
            v.regex(topic, /^topic:[\w-]+$/g)
        })
        .confirm()

    expect(() => new Validator("PatternInput")
        .array(["topic:invalid id"], "topics", (v, topic) => {
            v.string(topic)
            v.regex(topic, /^topic:[\w-]+$/)
        })
        .confirm()).toThrow("topics[0]: must match the required pattern")
})

it("validates string array items against allowed values with scoped paths", () => {
    new Validator("TagInput")
        .array(["nsfw", "spoiler"], "tags", (v, tag) => {
            v.string(tag)
            v.in(tag, ["nsfw", "spoiler"])
        })
        .confirm()

    expect(() => new Validator("TagInput")
        .array(["unsupported"], "tags", (v, tag) => {
            v.string(tag)
            v.in(tag, ["nsfw", "spoiler"])
        })
        .confirm()).toThrow("tags[0]: must be one of: nsfw, spoiler")
})