import type { User } from "../../shared/types"

export type TSession = {
    user: User
    accessToken: string
}

export type TExampleServer = {
    users: Record<string, TSession>
}