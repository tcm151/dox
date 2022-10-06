import Main from "./Main.vue"

import { createApp } from "vue"
import { router } from "./services/router"
import { createPinia } from "pinia"

export const app = createApp(Main)
app.use(router)

export const pinia = createPinia()
app.use(pinia)

app.mount("#app")
// createApp(Main).use(router).use(createPinia()).mount("#app")
