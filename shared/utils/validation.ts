import type { User } from "../types"
import { parseRecordId } from "./records"

export const useValidation = () => {
    const user = {
        email: (v: string) => /^\S+@\S+\.\S+$/.test(v),
        name: (v: string) => /^[\w]{3,32}$/.test(v),
        password: (v: string) => /^[\S]{8,64}$/.test(v),
        description: (v: string) => /^[\w\W]{0,256}$/.test(v),
    }

    const post = {
        title: (v: string) => /.{4,128}/.test(v)
    }

    const topic = {
        name: (v: string) => /^\b[A-Za-z]{3,24}\b$/.test(v)
    }

    const record = {
        id: (v: string) => parseRecordId(v) !== undefined,
    }

    return {
        user, post, topic, record
    }
}

const regex = {
    "user.email": (v: string) => /^\S+@\S+\.\S+$/.test(v),
    "user.name": (v: string) => /^[\w]{3,32}$/.test(v),
    "user.password": (v: string) => /^[\S]{8,64}$/.test(v),
    "user.description": (v: string) => /^[\w\W]{0,256}$/.test(v),

    "post.title": (v: string) => /.{4,128}/.test(v),
    
    "topic.id": (v: string) => /^\b[A-Za-z]{3,24}\b$/.test(v),
    "record.id": (v: string) => /^\w+:[\w-]+$/.test(v),
}

export class Validator {
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

    match(value: string, type: keyof typeof regex) {
        if (!regex[type](value)) {
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

export function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null
}

export function isValidUser(value: unknown): value is User {
    if (!isObject(value)) return false

    return typeof value.id === "string"
        && typeof value.name === "string"
        && typeof value.score === "number"
        && typeof value.visits === "number"
        && typeof value.dateJoined === "string"
        && typeof value.tokens === "number"
        && isStringArray(value.topics)
        && isStringArray(value.followers)
        && isStringArray(value.following)
        && isVoteCounts(value.votes)
        && isRoleArray(value.roles)
        && isTraitArray(value.traits)
        && (value.link === undefined || typeof value.link === "string")
        && (value.description === undefined || typeof value.description === "string")
}

export function isRecordWithValidId(value: unknown): value is { id: string } {
    return isObject(value)
        && typeof value.id === "string"
        && parseRecordId(value.id) !== undefined
}

function isStringArray(value: unknown): value is string[] {
    return Array.isArray(value) && value.every(item => typeof item === "string")
}

function isVoteCounts(value: unknown): value is User["votes"] {
    if (!isObject(value)) return false

    return isStringArray(value.positive)
        && isStringArray(value.misleading)
        && isStringArray(value.negative)
        && isStringArray(value.awards)
        && isStringArray(value.saves)
}

function isRoleArray(value: unknown): value is User["roles"] {
    return Array.isArray(value)
        && value.every(role => role === "admin" || role === "developer" || role === "moderator")
}

function isTraitArray(value: unknown): value is User["traits"] {
    return Array.isArray(value)
        && value.every(trait => trait === "confirmed" || trait === "verified")
}