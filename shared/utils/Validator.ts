import { isObject } from "./validation"

export class Validator {
    private static readonly regex = {
        "user.email": (v: string) => /^\S+@\S+\.\S+$/.test(v),
        "user.name": (v: string) => /^[\w]{3,32}$/.test(v),
        "user.password": (v: string) => /^[\S]{8,64}$/.test(v),
        "user.description": (v: string) => /^[\w\W]{0,256}$/.test(v),

        "post.title": (v: string) => /.{4,128}/.test(v),

        "topic.id": (v: string) => /^\b[A-Za-z]{3,24}\b$/.test(v),
        "record.id": (v: string) => /^\w+:[\w-]+$/.test(v),
    }

    item: string
    #messages: string[] = []

    constructor(item: string) {
        this.item = item
    }

    test<T>(value: T, action: (v: T) => boolean, message: string) {
        if (!action(value)) {
            this.#messages.push(message)
        }
        return this
    }

    object(value: unknown, label: string, validate: (validator: this) => void): this {
        if (!isObject(value)) {
            this.#messages.push(`${label} must be an object`)
            return this
        }

        validate(this)
        return this
    }

    boolean(value: unknown, field: string) {
        return this.test(value, input => typeof input === "boolean", `${field} must be a boolean`)
    }

    number(value: unknown, field: string) {
        return this.test(value, input => typeof input === "number", `${field} must be a number`)
    }

    match(value: string, type: keyof typeof Validator.regex) {
        if (!Validator.regex[type](value)) {
            this.#messages.push(`Invalid ${type}`)
        }
        return this
    }

    confirm(): void {
        if (this.#messages.length > 0) {
            throw createError({
                status: 400,
                statusText: `Validation failed for: ${this.item}`,
                message: this.#messages.join(". "),
            })
        }
    }
}