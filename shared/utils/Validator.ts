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
    private path = ""
    #messages: string[] = []

    constructor(item: string) {
        this.item = item
    }

    test<T>(value: T, action: (v: T) => boolean, message: string) {
        if (!action(value)) {
            this.addError(message)
        }
        return this
    }

    object<T>(value: T, field: string, validate?: (validator: this, value: T) => void): this {
        const path = this.fieldPath(field)
        if (!isObject(value) || Array.isArray(value)) {
            this.addError("must be an object", path)
            return this
        }

        if (!validate) return this

        const previousPath = this.path
        this.path = path
        try {
            validate(this, value)
        }
        finally {
            this.path = previousPath
        }
        return this
    }

    string(value: unknown, field = "") {
        return this.check(value, input => typeof input === "string", "must be a string", this.fieldPath(field))
    }

    boolean(value: unknown, field = "") {
        return this.check(value, input => typeof input === "boolean", "must be a boolean", this.fieldPath(field))
    }

    number(value: unknown, field = "") {
        return this.check(value, input => typeof input === "number" && Number.isFinite(input), "must be a finite number", this.fieldPath(field))
    }

    integer(value: unknown, options?: { min?: number, max?: number }): this
    integer(value: unknown, field: string, options?: { min?: number, max?: number }): this
    integer(
        value: unknown,
        fieldOrOptions: string | { min?: number, max?: number } = "",
        options: { min?: number, max?: number } = {},
    ) {
        const field = typeof fieldOrOptions === "string" ? fieldOrOptions : ""
        const bounds = typeof fieldOrOptions === "string" ? options : fieldOrOptions
        const { min, max } = bounds
        let message = "must be a safe integer"
        if (min !== undefined && max !== undefined) {
            message = `must be a safe integer between ${min} and ${max}`
        }
        else if (min !== undefined) {
            message = `must be a safe integer of at least ${min}`
        }
        else if (max !== undefined) {
            message = `must be a safe integer no greater than ${max}`
        }

        return this.check(
            value,
            input => typeof input === "number"
                && Number.isSafeInteger(input)
                && (min === undefined || input >= min)
                && (max === undefined || input <= max),
            message,
            this.fieldPath(field),
        )
    }

    array(value: unknown, field: string, validateItem?: (validator: this, item: unknown, index: number) => void): this {
        const path = this.fieldPath(field)
        if (!Array.isArray(value)) {
            this.addError("must be an array", path)
            return this
        }

        if (!validateItem) return this

        const previousPath = this.path
        try {
            value.forEach((item, index) => {
                this.path = `${path}[${index}]`
                validateItem(this, item, index)
            })
        }
        finally {
            this.path = previousPath
        }
        return this
    }

    match(value: string, type: keyof typeof Validator.regex) {
        if (!Validator.regex[type](value)) {
            this.addError(`Invalid ${type}`)
        }
        return this
    }

    private check<T>(value: T, action: (value: T) => boolean, message: string, path: string) {
        if (!action(value)) {
            this.addError(message, path)
        }
        return this
    }

    private fieldPath(field: string) {
        if (!field) return this.path
        return this.path ? `${this.path}.${field}` : field
    }

    private addError(message: string, path = this.path) {
        this.#messages.push(path ? `${path}: ${message}` : message)
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