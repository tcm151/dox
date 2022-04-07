//- sever variables
import express from "express"
import cors from "cors"
const app = express()
const PORT = 8080

//- middleware
app.use(cors())
app.use(express.urlencoded({ extended: true }))

//- database
import * as database from "./database"

//- get requests
app.get("/posts", database.getPosts())
app.get("/posts/:post_id", database.getPost())
app.get("/posts/:post_id/comments", database.getPostComments())
app.get("/users/:user_id", database.getUser())
app.get("/users/:user_id/posts", database.getUsersPosts())
app.get("/users/:user_id/comments", database.getUsersComments())

//- post methods
app.post("/newUser", database.addNewUser())
app.post("/authenticate", database.authenticateUser())
app.post("/logout", database.logoutUser())
app.post("/newPost", database.createPost())
app.post("/newComment", database.createComment())
app.post("/modifyDatabase", database.modifyDatabase())

//- server startup sequence
app.listen(8080, async () => {
    console.log("Turning on server...")
    await database.connectToDatabase().then(() => {
        console.log(`Server running on port:${PORT}`)
    })
})
