import { Request, Response } from "express"
import { User, Post, Comment, Votes } from "./types"
import { MongoClient, Collection, Db } from "mongodb"
import { Session } from "../services/store"
import moment from "moment"

//- enviroment variables
let database: Db
let users_collection: Collection<User>
let posts_collection: Collection<Post>
let comments_collection: Collection<Comment>
const connectionURI =
    "mongodb+srv://tcm:cooltyler333@assignment-7.0mfdb.mongodb.net/final_project?retryWrites=true&w=majority"

export function currentTime() {
    return moment().format("YYYY/MM/DD, HH:mm:ss")
}

//> CONNECT TO THE DATABASE AND POPULATE COLLECTIONS
export async function connectToDatabase(): Promise<void> {
    let connection = await MongoClient.connect(connectionURI)
    if (!connection) {
        console.log(`Unable to connect to database.}`)
        return
    }

    database = connection.db("final_project")
    users_collection = database.collection("users")
    posts_collection = database.collection("posts")
    comments_collection = database.collection("comments")
    console.log(`Connected to database: ${database.databaseName}`)
    return
}

//> ADD A NEW USER TO THE DATABASE
export function addNewUser() {
    return async (request: Request, response: Response) => {
        // fetch user metadata for new user creation
        const usersMetadata = (await users_collection.findOne({ meta: "users" })) as any
        if (!usersMetadata) {
            response.status(404).send("Unable to retreive user metadata...")
            return
        }

        // temporary object for new user
        let newUser = request.body as unknown as User

        console.log(newUser);

        // check if user exsists with matching data
        const existingEmail = await users_collection.findOne({ email: newUser.email })
        const existingUserName = await users_collection.findOne({ userName: newUser.username })
        if (existingEmail || existingUserName) {
            response.status(400).send("User already exists with matching information")
            return
        }

        // upload the new user to the database
        newUser.user_id = usersMetadata.nextUserId
        await users_collection.insertOne(newUser)

        // update the user metadata
        let metadataUpdateResult = await users_collection.updateOne(
            { meta: "users" },
            { $set: { nextUserId: usersMetadata.nextUserId + 1 } }
        )
        if (metadataUpdateResult.modifiedCount != 1) {
            response.status(500).send("Unable to update users metadata...")
            return
        }

        // send confirmation response
        response.status(201).send("Created new user sucessfully")
    }
}

//> AUTHENTICATE USERS LOGIN
export function authenticateUser() {
    return async (request: Request, response: Response) => {
        // cache login info and check if they were provided
        const username = request.body.username
        const password = request.body.password
        if (!(username && password)) {
            response.status(400).send("failed to provide username or password")
            return
        }

        // check if a user exists with matching credentials
        const matchingUser = await users_collection.findOne({ username: username, password: password })
        if (!matchingUser) {
            response.status(400).send("Username or password were incorrect.")
            return
        }

        // store user in session and redirect home
        const newSession: Session = {
            user: matchingUser,
            authenticated: true,
        }
        console.log(`Authenticated user: ${username}`)
        response.status(200).send(newSession)
    }
}

//> LOGOUT THE CURRENT USER
export function logoutUser() {
    return async (request: Request, response: Response) => {
        // request.session.user = undefined;
        // request.session.authenticated = false;
        response.status(200).redirect("/")
    }
}

export function getUser() {
    return async (request: Request, response: Response) => {
        const user = await users_collection.findOne({ user_id: Number(request.params.user_id) })
        response.send(200).send(user)
    }
}

//> FETCH ALL POSTS
export function getPosts() {
    return async (request: Request, response: Response) => {
        const allPosts = await posts_collection
            .find({ post_id: { $exists: true } })
            .sort({ time: -1 })
            .toArray()
        response.status(200).send(allPosts)
    }
}

export function getPost() {
    return async (request: Request, response: Response) => {
        const post = await posts_collection.findOne({ post_id: Number(request.params.post_id) })
        response.status(200).send(post)
    }
}

//> CREATE A NEW POST
export function createPost() {
    return async (request: Request, response: Response) => {
        // fetch post metadata for new post creation
        const postsMetadata = (await posts_collection.findOne({ meta: "posts" })) as any
        if (!postsMetadata) {
            response.status(404).send("Unable to retreive posts metadata...")
            return
        }

        // create post and upload to database
        let newPost: Post = {
            post_id: postsMetadata.nextPostId,
            user_id: Number(request.body.user_id),
            title: request.body.title,
            content: request.body.content,
            time: currentTime(),
            votes: {
                upvotes: 0,
                misleading: 0,
                downvotes: 0,
                users: [],
            },
        }
        await posts_collection.insertOne(newPost)

        // update the user metadata
        let metadataUpdateResult = await posts_collection.updateOne(
            { meta: "posts" },
            { $set: { nextPostId: postsMetadata.nextPostId + 1 } }
        )
        if (metadataUpdateResult.modifiedCount != 1) {
            response.status(500).send("Unable to update posts metadata...")
            return
        }

        // send confirmation response
        response.status(201).send(newPost)
    }
}

//> GET COMMENTS FOR A POST
export function getPostComments() {
    return async (request: Request, response: Response) => {
        const comments = await comments_collection.find({ post_id: Number(request.params.post_id) }).toArray()

        const aggregation = await comments_collection
            .aggregate<Comment>([
                {
                    $match: {
                        post_id: Number(request.params.post_id),
                    },
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "user_id",
                        foreignField: "user_id",
                        as: "user",
                    },
                },
                {
                    $unwind: "$user",
                },
            ])
            .toArray()

        // console.log(aggregation)

        response.status(200).send(aggregation)
    }
}

export function modifyDatabase() {
    return async (request: Request, response: Response) => {
        const aggregation = await posts_collection
            .aggregate([
                {
                    $addFields: {
                        "votes.users": [],
                    },
                },
                {
                    $merge: {
                        into: "posts",
                        // on: "post_id",
                    },
                },
            ])
            .toArray()

        response.status(200).send(aggregation)
    }
}

//> CREATE A NEW COMMENT
export function createComment() {
    return async (request: Request, response: Response) => {
        // fetch post metadata for new post creation
        const commentsMetadata = (await comments_collection.findOne({ meta: "comments" })) as any
        if (!commentsMetadata) {
            response.status(404).send("Unable to retreive comments metadata...")
            return
        }

        // const user = users_collection.findOne({ user_id: request.body.user_id})

        // create post and upload to database
        let newComment: Comment = {
            comment_id: commentsMetadata.nextCommentId,
            user_id: Number(request.body.user_id),
            post_id: Number(request.body.post_id),
            reply_to: Number(request.body.reply_to),
            content: request.body.content,
            time: currentTime(),
            votes: {
                upvotes: 0,
                misleading: 0,
                downvotes: 0,
                users: [],
            },
        }
        await comments_collection.insertOne(newComment)

        // update the user metadata
        let metadataUpdateResult = await comments_collection.updateOne(
            { meta: "comments" },
            { $set: { nextCommentId: Number(commentsMetadata.nextCommentId) + 1 } }
        )
        if (metadataUpdateResult.modifiedCount != 1) {
            response.status(500).send("Unable to update comments metadata...")
            return
        }

        // send confirmation response
        response.status(201).send("Created new comment sucessfully")
    }
}
