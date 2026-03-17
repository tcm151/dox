import type { User, Role } from "~/types"

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
            statusCode: 403,
            message: "You do not have permission to do this."
        })
    }
}