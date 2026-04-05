export interface Record {
    id: string
}

export interface Voteable extends Record {
    score: number
    votes: {
        positive: string[]
        misleading: string[]
        negative: string[]
        awards: string[]
        saves: string[]
    }
}

export interface Sortable extends Record, Voteable {
    time: string
    visits: number
    // pinned: boolean
    // deleted: boolean
    // archived: boolean
}

export interface Account extends Record {
    email: string
    password: string
    user: User & string
}

export interface User extends Sortable {
    name: string
    link?: string
    description?: string
    topics: string[]
    followers: string[]
    following: string[]
    dateJoined: string
    tokens: number
    roles: Role[]
    traits: Trait[]
}

export type Role = "admin" | "developer" | "moderator"
export type Trait = "confirmed" | "verified"

export interface Session extends Record {
    account: Account & string
    time: string
    invalidated: boolean
}

export interface Topic extends Sortable {
    description?: string
    posts: Post[]
    threads: Thread[]
    followers: (User & string)[]
    moderators: (User & string)[]
    firstUsed: string
}

export interface Post extends Sortable {
    user: User & string
    title: string
    content: string
    replyTo?: Post & string
    topics: string[]
    comments: (Comment & string)[]
    images: (Image & string)[]
    archived: boolean
    edited: boolean
    timeEdited?: string
}

export interface Draft extends Record {
    user: User & string
    title: string
    content: string
    time: string
    replyTo?: Post & string
    topics: string[]
    images: Image[]
}

export interface Comment extends Sortable {
    user: User & string
    post: Post & string
    content: string
    replyTo: (Post | Comment) & string
    deleted: boolean
    edited: boolean
    timeEdited?: string
}

export interface Thread extends Sortable {
    user: User & string
    content: string
    quote?: Thread & string
    replyTo?: Thread & string
    topics: string[]
    replies: (Thread & string)[]
    images: (Image & string)[]
    chain?: Thread[]
    archived: boolean
    deleted: boolean
    edited: boolean
    timeEdited?: string
}

export interface Media extends Sortable {
    user: User & string
    type: string
    name: string
    url: string
    tokens: number
}

export interface Image extends Media { }
export interface Audio extends Media { }

export interface Pin extends Record {
    item: Post | Thread
    user: User
    active: boolean
    time: string
}

export interface Notification extends Record {
    recipient: User & string
    context: (Post | Comment) & string
    message: string
    time: string
    viewed: boolean
}

export interface Feedback extends Record {
    user: User & string
    content: string
    time: string
    dismissed: boolean
}

export interface Report extends Record {
    reporter: User & string
    subject: Voteable & string
    time: string
}

export interface AccountConfirmation extends Record {
    account: Account & string
    time: string
    used: boolean
    expired: boolean
}

export interface PasswordReset extends Record {
    account: Account & string
    time: string
    used: boolean
    expired: boolean
}

export interface ReferralClaim extends Record {
    claimant: User & string
    recipient: User & string
    time: string
}

export interface ModerationRequest extends Record {
    topic: Topic & string
    user: User & string
    approvals: string[]
    denials: string[]
    closed: boolean
}

export interface Error extends Record {
    status: number
    description: string
    request: any
    time: string
    user: User & string
    stack: string
    data: { [key: string]: any }
}

export interface AppSettings extends Record {
    email: {
        support: string
        additional: string
    }
    moderation: {
        threshold: number
    }
    voting: {
        enabled: boolean
        misleading: boolean
        negative: boolean
    }
    topics: {
        perSubmission: number
        restrict: boolean
        allowed: string[]
    }
    feeds: {
        search: boolean
        discover: boolean
        topics: boolean
        posts: boolean
        threads: boolean
        images: boolean
        audio: boolean
        video: boolean
    }
    posts: {
        enabled: boolean
    }
    threads: {
        enabled: boolean
    }
    media: {
        tokens: {
            enabled: boolean
        }
        images: {
            enabled: boolean
            uploadLimit: number
        }
        audio: {
            enabled: boolean
            uploadLimit: number
        }
        video: {
            enabled: boolean
            uploadLimit: number
        }
    }
    misc: {
        feedback: {
            enabled: true
            allowAnonymous: false
        }
    }
}