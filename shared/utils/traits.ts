import type { User, Trait } from "@@/shared/types"

export function hasTrait(user: User, trait: Trait) {
    return user.traits.includes(trait)
}

export function requireTrait(user: User, trait: Trait) {
    if (!hasTrait(user, trait)) {
        throw createError({
            status: 403,
            statusText: `Your account must be ${trait} to do this.`
        })
    }
}