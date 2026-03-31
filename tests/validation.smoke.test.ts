import { describe, expect, it } from "vitest"
import { useValidation } from "../shared/utils/validation"

describe("validation rules", () => {
    it("validates user and record input basics", () => {
        const validation = useValidation()

        expect(validation.user.email("dev@example.com")).toBe(true)
        expect(validation.user.email("not-an-email")).toBe(false)
        expect(validation.user.name("valid_name_1")).toBe(true)
        expect(validation.user.name("x")).toBe(false)
        expect(validation.user.password("good-password-123")).toBe(true)
        expect(validation.user.password("short")).toBe(false)
        expect(validation.record.id("post:abc123")).toBe(true)
        expect(validation.record.id("bad id")).toBe(false)
    })

    it("validates content model basics", () => {
        const validation = useValidation()

        expect(validation.post.title("A valid post title")).toBe(true)
        expect(validation.post.title("no")).toBe(false)
        expect(validation.topic.name("NuxtTopic")).toBe(true)
        expect(validation.topic.name("12")).toBe(false)
    })
})
