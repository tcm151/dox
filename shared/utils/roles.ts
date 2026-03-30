import type { User, Role } from "@@/shared/types"

export function hasRole(user: User, role: Role | Role[]) {
    if (Array.isArray(role)) {
        return user.roles.some(r => role.includes(r))
    }
    else {
        return user.roles.includes(role)
    }
}

export function requireRole(user: User, role: Role | Role[]) {
    if (!hasRole(user, role)) {
        throw createError({
            status: 403,
            statusText: "You do not have permission to do this."
        })
    }
}