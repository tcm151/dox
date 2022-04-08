// import { Request, response, Response } from "express"
// import { User, Post, Comment, Votes } from "./types"
// import { MongoClient, Collection, Db } from "mongodb"
// import { Session } from "../services/store"
// import bcrypt from "bcryptjs"
// import moment from "moment"

// //- enviroment variables
// let database: Db
// let users_collection: Collection<User>
// let posts_collection: Collection<Post>
// let comments_collection: Collection<Comment>
// const connectionURI =
//     "mongodb+srv://tcm:cooltyler333@assignment-7.0mfdb.mongodb.net/final_project?retryWrites=true&w=majority"

// //- CURRENT FORMATED TIME
// export function currentTime() {
//     return moment().format("YYYY/MM/DD HH:mm:ss")
// }

// //> CONNECT TO THE DATABASE AND POPULATE COLLECTIONS
// export async function connectToDatabase(): Promise<void> {
//     let connection = await MongoClient.connect(connectionURI)
//     if (!connection) {
//         log("Failed to connect to database")
//         return
//     }

//     database = connection.db("final_project")
//     users_collection = database.collection("users")
//     posts_collection = database.collection("posts")
//     comments_collection = database.collection("comments")
//     log(`Connected to database: ${database.databaseName}`)
//     return
// }

// //> ADD A NEW USER TO THE DATABASE
// export function addNewUser() {
//     return async (request: Request, response: Response) => {
//         // fetch user metadata for new user creation
//         const usersMetadata = (await users_collection.findOne({ meta: "users" })) as any
//         if (!usersMetadata) {
//             response.status(404).send("Unable to retreive user metadata...")
//             return
//         }

//         // temporary object for new user
//         let newUser = request.body as unknown as User

//         // check if user exsists with matching data
//         const existingEmail = await users_collection.findOne({ email: newUser.email })
//         const existingUserName = await users_collection.findOne({ userName: newUser.username })
//         if (existingEmail || existingUserName) {
//             response.status(400).send("User already exists with matching information")
//             return
//         }

//         // upload the new user to the database
//         newUser.user_id = usersMetadata.nextUserId
//         await users_collection.insertOne(newUser)

//         // update the user metadata
//         let metadataUpdateResult = await users_collection.updateOne(
//             { meta: "users" },
//             { $set: { nextUserId: usersMetadata.nextUserId + 1 } }
//         )
//         if (metadataUpdateResult.modifiedCount != 1) {
//             response.status(500).send("Unable to update users metadata...")
//             return
//         }

//         // send confirmation response
//         response.status(201).send("Created new user sucessfully")
//         log(`Registered new user: ${newUser.username}`)
//     }
// }

// //> AUTHENTICATE USERS LOGIN
// export function authenticateUser() {
//     return async (request: Request, response: Response) => {
//         // cache login info and check if they were provided
//         const username = request.body.username
//         const password = request.body.password
//         if (!(username && password)) {
//             response.status(400).send("failed to provide username or password")
//             return
//         }

//         // check if a user exists with matching credentials
//         const matchingUser = await users_collection.findOne<User>({ username: username })
//         if (!matchingUser) {
//             response.status(400).send("No user exists with matching username")
//             return
//         }

//         // compare password to matching hash
//         if (!(await bcrypt.compare(password, matchingUser.password))) {
//             response.status(400).send("Password does not match")
//             return
//         }

//         // store user in session and redirect home
//         const newSession: Session = {
//             user: matchingUser,
//             authenticated: true,
//         }
//         response.status(200).send(newSession)
//         log(`Authenticated user: ${username}`)
//     }
// }

// //> GET A USER
// export function getUser() {
//     return async (request: Request, response: Response) => {
//         const user = await users_collection.findOne<User>({ user_id: Number(request.params.user_id) })
//         response.send(200).send(user)
//     }
// }

// //> FETCH ALL POSTS
// export function getAllPosts() {
//     return async (request: Request, response: Response) => {
//         const posts = await posts_collection
//             .aggregate<Post>([
//                 {
//                     $match: {
//                         post_id: { $exists: true },
//                     },
//                 },
//                 // {
//                 //     $sort: {
//                 //         time: -1,
//                 //     },
//                 // },
//                 {
//                     $lookup: {
//                         from: "users",
//                         localField: "user_id",
//                         foreignField: "user_id",
//                         as: "user",
//                     },
//                 },
//                 {
//                     $unwind: "$user",
//                 },
//             ])
//             .toArray()
//         response.status(200).send(posts)
//     }
// }

// //> GET A SINGLE POST
// export function getPost() {
//     return async (request: Request, response: Response) => {
//         const post = await posts_collection.findOne({ post_id: Number(request.params.post_id) })
//         response.status(200).send(post)
//     }
// }

// //> CREATE A NEW POST
// export function createPost() {
//     return async (request: Request, response: Response) => {
//         // fetch post metadata for new post creation
//         const postsMetadata = (await posts_collection.findOne({ meta: "posts" })) as any
//         if (!postsMetadata) {
//             response.status(404).send("Unable to retreive posts metadata...")
//             return
//         }

//         // create post and upload to database
//         let newPost: Post = {
//             post_id: postsMetadata.nextPostId,
//             user_id: Number(request.body.user_id),
//             title: request.body.title,
//             content: request.body.content,
//             time: currentTime(),
//             votes: {
//                 upvotes: Math.floor(Math.random() * 100_000),
//                 misleading: Math.floor(Math.random() * 10_000),
//                 downvotes: Math.floor(Math.random() * 25_000),
//                 users: [],
//             },
//         }
//         await posts_collection.insertOne(newPost)

//         // update the user metadata
//         let metadataUpdateResult = await posts_collection.updateOne(
//             { meta: "posts" },
//             { $set: { nextPostId: postsMetadata.nextPostId + 1 } }
//         )
//         if (metadataUpdateResult.modifiedCount != 1) {
//             response.status(500).send("Unable to update posts metadata...")
//             return
//         }

//         // send confirmation response
//         response.status(201).send(newPost)
//         log(`User: ${request.body.user_id} created a new post: ${newPost.post_id}`)
//     }
// }

// //> GET COMMENTS FOR A POST
// export function getPostComments() {
//     return async (request: Request, response: Response) => {
//         const comments = await comments_collection.find({ post_id: Number(request.params.post_id) }).toArray()

//         const aggregation = await comments_collection
//             .aggregate<Comment>([
//                 {
//                     $match: {
//                         post_id: Number(request.params.post_id),
//                     },
//                 },
//                 {
//                     $lookup: {
//                         from: "users",
//                         localField: "user_id",
//                         foreignField: "user_id",
//                         as: "user",
//                     },
//                 },
//                 {
//                     $unwind: "$user",
//                 },
//             ])
//             .toArray()

//         // send confirmation
//         response.status(200).send(aggregation)
//     }
// }

// export function getUsersPosts() {
//     return async (request: Request, response: Response) => {
//         // const posts = await posts_collection.find<Post>({ user_id: Number(request.params.user_id) }).toArray()
//         const posts = await posts_collection
//             .aggregate<Post>([
//                 {
//                     $match: {
//                         post_id: { $exists: true },
//                     },
//                 },
//                 // {
//                 //     $sort: {
//                 //         time: -1,
//                 //     },
//                 // },
//                 {
//                     $lookup: {
//                         from: "users",
//                         localField: "user_id",
//                         foreignField: "user_id",
//                         as: "user",
//                     },
//                 },
//                 {
//                     $unwind: "$user",
//                 },
//             ])
//             .toArray()
//         response.status(200).send(posts)
//     }
// }

// export function getUsersComments() {
//     return async (request: Request, response: Response) => {
//         // const comments = await comments_collection.find<Comment>({ user_id: Number(request.params.user_id) }).toArray()
//         const comments = await comments_collection
//             .aggregate<Comment>([
//                 {
//                     $match: {
//                         comment_id: { $exists: true },
//                     },
//                 },
//                 // {
//                 //     $sort: {
//                 //         time: -1,
//                 //     },
//                 // },
//                 {
//                     $lookup: {
//                         from: "users",
//                         localField: "user_id",
//                         foreignField: "user_id",
//                         as: "user",
//                     },
//                 },
//                 {
//                     $unwind: "$user",
//                 },
//             ])
//             .toArray()
//         response.status(200).send(comments)
//     }
// }

// export function modifyDatabase() {
//     return async (request: Request, response: Response) => {
//         const aggregation = await posts_collection
//             .aggregate([
//                 {
//                     $addFields: {
//                         "votes.users": [],
//                     },
//                 },
//                 {
//                     $merge: {
//                         into: "posts",
//                         // on: "post_id",
//                     },
//                 },
//             ])
//             .toArray()

//         response.status(200).send(aggregation)
//         log("Database was modified sucessfully")
//     }
// }

// //> CREATE A NEW COMMENT
// export function createComment() {
//     return async (request: Request, response: Response) => {
//         // fetch post metadata for new post creation
//         const commentsMetadata = (await comments_collection.findOne({ meta: "comments" })) as any
//         if (!commentsMetadata) {
//             response.status(404).send("Unable to retreive comments metadata...")
//             return
//         }

//         // const user = users_collection.findOne({ user_id: request.body.user_id})

//         // create post and upload to database
//         let newComment: Comment = {
//             comment_id: commentsMetadata.nextCommentId,
//             user_id: Number(request.body.user_id),
//             post_id: Number(request.body.post_id),
//             reply_to: Number(request.body.reply_to),
//             content: request.body.content,
//             time: currentTime(),
//             votes: {
//                 upvotes: 1,
//                 misleading: 0,
//                 downvotes: 0,
//                 users: [],
//             },
//         }
//         await comments_collection.insertOne(newComment)

//         // update the user metadata
//         let metadataUpdateResult = await comments_collection.updateOne(
//             { meta: "comments" },
//             { $set: { nextCommentId: Number(commentsMetadata.nextCommentId) + 1 } }
//         )
//         if (metadataUpdateResult.modifiedCount != 1) {
//             response.status(500).send("Unable to update comments metadata...")
//             return
//         }

//         // send confirmation response
//         response.status(201).send("Created new comment sucessfully")
//         log(`User: ${request.body.user_id} created new comment: ${newComment.comment_id}`)
//     }
// }

// export function log(message: string) {
//     console.log(`[${currentTime()}]: ${message}`)
// }
