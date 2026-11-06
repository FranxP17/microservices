import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import './services/interceptors'
import './assets/styles/reset.css'
import './assets/styles/variables.css'
import './assets/styles/global.css'
import './assets/styles/auth.css'

const app = createApp(App)

const pinia = createPinia()

app.use(pinia)
app.use(router)

app.mount('#app')