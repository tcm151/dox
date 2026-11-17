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

export interface FeedPage<T extends Sortable> {
    items: T[]
    offset: number
    more: boolean
}

export interface Account extends Record {
    email: string
    password: string
    user: User & string
}

export interface User extends Voteable {
    name: string
    visible?: boolean
    link?: string
    description?: string
    topics: string[]
    followers: string[]
    following: string[]
    dateJoined: string
    visits: number
    tokens: number
    roles: Role[]
    traits: Trait[]
}

export type Role = "admin" | "developer" | "moderator"
export type Trait = "confirmed" | "verified"
export type ContentStatus = "active" | "archived" | "quarantined" | "deleted"
export type ContentVisibilityTag = "nsfw" | "spoiler"
export type ContentVisibilityMode = "show" | "mask" | "filter"
export type ProfileVisibility = "public" | "members" | "private"
export type TopicStatus = "active" | "locked"
export type PinScope = "app" | "topic"

export interface Session extends Record {
    account: Omit<Account, "password"> & string
    time: string
    invalidated: boolean
}

export interface Topic extends Sortable {
    description?: string
    rules?: string
    status: TopicStatus
    posts: Post[]
    links: Link[]
    moderation: {
        maxPostInterval: number
        priorityReportThreshold: number
    }
    threads: Thread[]
    galleries: Gallery[]
    followers: (User & string)[]
    moderators: (User & string)[]
    firstUsed?: string
}

export interface ContentModerationState {
    locked?: "item"
    slowed?: number
}

export interface Post extends Sortable {
    user: User & string
    title: string
    content: string
    tags: string[]
    replyTo?: Post & string
    topics: string[]
    comments: (Comment & string)[]
    images: Attachment[]
    status: ContentStatus
    edited: boolean
    timeEdited?: string
    moderation?: ContentModerationState
}

export interface Link extends Sortable {
    user: User & string
    title: string
    description: string
    url: string
    preview: {
        title?: string
        description?: string
        canonicalUrl?: string
        imageUrl?: string
    }
    tags: string[]
    topics: string[]
    comments: (Comment & string)[]
    status: ContentStatus
    edited: boolean
    timeEdited?: string
    moderation?: ContentModerationState
}

export interface Draft extends Record {
    user: User & string
    title: string
    content: string
    tags: string[]
    time: string
    replyTo?: Post & string
    topics: string[]
    images: Image[]
}

export interface Comment extends Sortable {
    user: User & string
    context: (Post | Link | Gallery) & string
    content: string
    replyTo: (Post | Link | Gallery | Comment) & string
    deleted: boolean
    status: ContentStatus
    edited: boolean
    timeEdited?: string
    moderation?: ContentModerationState
}

export interface Thread extends Sortable {
    user: User & string
    content: string
    tags: string[]
    quote?: Thread & string
    quotes: (Thread & string)[]
    replyTo?: Thread & string
    topics: string[]
    replies: Thread[]
    images: Attachment[]
    ancestors?: Thread[]
    chain?: Thread[]
    status: ContentStatus
    deleted: boolean
    edited: boolean
    timeEdited?: string
    moderation?: ContentModerationState
}

export type MediaExtension = "gif" | "webp" | "png" | "jpeg" | "mp3"

export interface Media extends Sortable {
    user: User & string
    type: MediaExtension
    name: string
    url: string
    tokens: number
}

export interface Image extends Media {
    description: string
    status: ContentStatus
}

export interface Gallery extends Sortable {
    user: User & string
    title: string
    description: string
    tags: string[]
    topics: string[]
    comments: (Comment & string)[]
    images: Attachment[]
    status: ContentStatus
    moderation?: ContentModerationState
}

export interface SearchComment extends Voteable {
    user: Pick<User, "id" | "name" | "roles">
    context: Pick<Post, "id" | "title" | "tags">
        | Pick<Link, "id" | "title" | "description" | "url" | "tags">
        | Pick<Gallery, "id" | "title" | "description" | "tags">
    content: string
    time: string
    edited: boolean
    deleted: boolean
    timeEdited?: string
    moderation?: ContentModerationState
}

export type SearchResult = (Post | Link | Thread | Gallery | SearchComment) & {
    search: {
        exact: boolean
        score: number
    }
}

export interface Attachment extends Record {
    url: string
}

export interface Audio extends Media { }

export interface Pin extends Record {
    item: Post | Link | Thread | Gallery
    scope: PinScope
    topic?: Topic & string
    user: User
    active: boolean
    time: string
}

export interface Notification extends Record {
    recipient: User & string
    context: (Post | Link | Comment | User | Thread | Gallery | Image | Report | Topic) & string
    message: string
    time: string
    viewed: boolean
}

export interface UserSettings extends Record {
    user: User & string
    content: {
        visibility: Partial<{ [tag: string]: ContentVisibilityMode }>
        filters: {
            muted: string[]
            blocked: string[]
        }
    }
    privacy: {
        profile: ProfileVisibility
    }
    ui: {
        hoverAnimations: boolean
        hintDuration: number
    }
    notifications: {
        inApp: boolean
        email: boolean
    }
}

export type ContentFilterTargetType = "user" | "topic"

export interface Feedback extends Record {
    user?: User & string
    content: string
    time: string
    dismissed: boolean
}

export interface ReportHistoryEntry {
    action: string
    message?: string
    user: User & string
    time: string
    changes: { [key: string]: unknown }
}

export interface Report extends Record {
    subject: Record & string & {
        user?: User & string
        name?: string
        content?: string
        context?: string | { id: string }
    }
    owner: Pick<User, "id" | "name">
    topics: string[]
    priority?: boolean
    complaints: {
        user: User & string
        reason: string
        time: string
    }[]
    status: "pending" | "removed" | "appealed" | "denied" | "closed"
    time: string
    moderator?: User & string
    history: ReportHistoryEntry[]
}

export interface Moderation extends Record {
    subject: (Post | Link | Gallery | Comment | Thread) & string
    locked?: "item"
    slowed?: number
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

export interface ModeratorLog extends Record {
    actor: User & string
    action: string
    target: Record & string
    details: { [key: string]: unknown }
    time: string
}

export interface Error extends Record {
    status: number
    description: string
    request: {
        id?: string
        path?: string
        method?: string
        durationMs?: number
        headers?: {
            ip?: string
            origin?: string
            host?: string
            refererOrigin?: string
            userAgent?: string
        }
    }
    time: string
    user: User & string
    stack: string
    data: { [key: string]: any }
}

export interface AppSettings extends Record {
    about: {
        summary: string
    }
    email: {
        support: string
        additional: string
        spool: {
            dailyLimit: number
            batchLimit: number
            maxRetries: number
        }
    }
    moderation: {
        perTopic: number
        threshold: number
        slowModes: number[]
    }
    content: {
        visibility: {
            [tag in ContentVisibilityTag]: ContentVisibilityMode
        }
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
        links: boolean
        threads: boolean
        images: boolean
        audio: boolean
        video: boolean
        polls: boolean
    }
    posts: {
        enabled: boolean
    }
    links: {
        enabled: boolean
    },
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
            attachments: {
                posts: boolean
                threads: boolean
            }
        }
        gallery: {
            enabled: boolean
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
    polls: {
        enabled: boolean
    },
    misc: {
        feedback: {
            enabled: boolean
            allowAnonymous: boolean
        }
    }
}