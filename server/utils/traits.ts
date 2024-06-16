import type { User, Trait } from "~/types";

export function hasTrait(user: User, trait: Trait) {
    return user.traits.includes(trait)
}