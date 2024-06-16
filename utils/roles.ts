import type { User, Role } from "~/types";

export function hasRole(user: User, role: Role) {
    return user.roles.includes(role)
}