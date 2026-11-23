import type { Profile } from "../../shared/types"

export type TSession = {
    user: Profile
    accessToken: string
}

export type TExampleServer = {
    users: Record<string, TSession>
}