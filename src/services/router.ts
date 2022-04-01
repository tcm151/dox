import { createRouter, createWebHistory } from "vue-router"
import Home from "../views/Home.vue"
import About from "../views/About.vue"
import Post from "../views/Post.vue"
import Editor from "../views/Editor.vue"


export const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            name: "Home",
            path: "/",
            component: Home,
        },
        {
            name: "About",
            path: "/about",
            component: About,
        },
        {
            name: "Post",
            path: "/posts/:post_id",
            component: Post
        },
        {
            name: "Editor",
            path: "/editor",
            component: Editor
        }
    ],
})