import Main from "./Main.vue"

import { createApp } from "vue"
import { createPinia } from "pinia"
import { router } from "./services/router"

export const app = createApp(Main)
app.use(router)

export const pinia = createPinia()
app.use(pinia)

app.mount("#app")
