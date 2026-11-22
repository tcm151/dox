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
        title: (v: string) => /^[\s\S]{4,128}$/.test(v)
    }

    const topic = {
        name: (v: string) => /^[A-Za-z][A-Za-z0-9]{2,31}$/.test(v)
    }

    const record = {
        id: (v: string) => parseRecordId(v) !== undefined,
    }

    return {
        user, post, topic, record
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