import { isObject } from "./validation"

interface IntegerOptions {
    min?: number
    max?: number
}

interface LengthOptions {
    minLength?: number
    maxLength?: number
}

interface UrlOptions {
    protocols?: readonly string[]
    maxLength?: number
}

export class Validator {
    private static readonly regex = {
        "user.email": (v: string) => /^\S+@\S+\.\S+$/.test(v),
        "user.name": (v: string) => /^[\w]{3,32}$/.test(v),
        "user.password": (v: string) => /^[\S]{8,64}$/.test(v),
        "user.description": (v: string) => /^[\w\W]{0,256}$/.test(v),

        "post.title": (v: string) => /^[\s\S]{4,128}$/.test(v),

        "topic.id": (v: string) => /^\b[A-Za-z]{3,24}\b$/.test(v),
        "record.id": (v: string) => /^\w+:[\w-]+$/.test(v),
    }

    item: string
    private path = ""
    #messages: string[] = []

    constructor(item: string) {
        this.item = item
    }

    test<T>(value: T, action: (candidate: T) => boolean, message: string, field = "") {
        if (!action(value)) {
            this.addError(message, this.fieldPath(field))
        }
        return this
    }

    optional<T>(value: T | undefined, validate: (v: this, value: T) => void): this {
        if (value !== undefined) validate(this, value)
        return this
    }

    object<T>(value: T, field: string, validate?: (v: this, value: T) => void): this {
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

    string(value: unknown, field = "", options: LengthOptions = {}): this {
        const path = this.fieldPath(field)
        if (typeof value !== "string") {
            this.addError("must be a string", path)
            return this
        }

        const { minLength, maxLength } = options
        if (minLength !== undefined && value.length < minLength) {
            const message = maxLength === undefined
                ? `must be at least ${minLength} characters`
                : `must be between ${minLength} and ${maxLength} characters`
            this.addError(message, path)
        }
        else if (maxLength !== undefined && value.length > maxLength) {
            this.addError(`must be no more than ${maxLength} characters`, path)
        }
        return this
    }

    boolean(value: unknown, field = "") {
        return this.check(value, input => typeof input === "boolean", "must be a boolean", this.fieldPath(field))
    }

    number(value: unknown, field = "") {
        return this.check(value, input => typeof input === "number" && Number.isFinite(input), "must be a finite number", this.fieldPath(field))
    }

    integer(value: unknown, options?: IntegerOptions): this
    integer(value: unknown, field: string, options?: IntegerOptions): this
    integer(value: unknown, fieldOrOptions: string | IntegerOptions = "", options: IntegerOptions = {}) {
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

    array(value: unknown, field: string, validateItem?: (v: this, item: unknown, i: number) => void, options: LengthOptions = {}): this {
        const path = this.fieldPath(field)
        if (!Array.isArray(value)) {
            this.addError("must be an array", path)
            return this
        }

        const { minLength, maxLength } = options
        if (minLength !== undefined && value.length < minLength) {
            const message = maxLength === undefined
                ? `must have a length of at least ${minLength}`
                : `must have a length between ${minLength} and ${maxLength}`
            this.addError(message, path)
        }
        else if (maxLength !== undefined && value.length > maxLength) {
            this.addError(`must have a length no greater than ${maxLength}`, path)
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

    notEmpty(value: unknown, field = ""): this {
        if ((typeof value === "string" && value.length === 0) || (Array.isArray(value) && value.length === 0)) {
            this.addError("must not be empty", this.fieldPath(field))
        }
        return this
    }

    in(value: unknown, allowedValues: readonly unknown[]): this
    in(value: unknown, field: string, allowedValues: readonly unknown[]): this
    in(value: unknown, fieldOrAllowedValues: string | readonly unknown[], allowedValues?: readonly unknown[]): this {
        const field = typeof fieldOrAllowedValues === "string" ? fieldOrAllowedValues : ""
        const values = typeof fieldOrAllowedValues === "string" ? allowedValues ?? [] : fieldOrAllowedValues
        return this.check(
            value,
            candidate => values.includes(candidate),
            `must be one of: ${values.join(", ")}`,
            this.fieldPath(field),
        )
    }

    url(value: unknown, field: string, options: UrlOptions = {}): this {
        const protocols = options.protocols ?? ["http:", "https:"]
        const protocolNames = protocols.map(protocol => protocol.replace(/:$/, "").toUpperCase()).join(" or ")
        const message = `${protocolNames ? `must be a valid ${protocolNames} URL` : "must be a valid URL"}${options.maxLength === undefined ? "" : ` no longer than ${options.maxLength} characters`}`

        return this.check(value, (candidate) => {
            if (typeof candidate !== "string" || (options.maxLength !== undefined && candidate.length > options.maxLength)) {
                return false
            }

            try {
                const parsedUrl = new URL(candidate)
                return protocols.length === 0 || protocols.includes(parsedUrl.protocol)
            }
            catch {
                return false
            }
        }, message, this.fieldPath(field))
    }

    match(value: unknown, type: keyof typeof Validator.regex, field = "") {
        if (typeof value !== "string" || !Validator.regex[type](value)) {
            this.addError(`Invalid ${type}`, this.fieldPath(field))
        }
        return this
    }

    regex(value: unknown, pattern: RegExp, field = ""): this {
        const expression = new RegExp(pattern)
        if (typeof value !== "string" || !expression.test(value)) {
            this.addError("must match the required pattern", this.fieldPath(field))
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