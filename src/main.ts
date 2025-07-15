import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { Button, NavBar, Tabbar, TabbarItem, Cell, Icon, Image, Lazyload, Swipe, SwipeItem, Toast, Popup, Field } from 'vant'
import 'vant/lib/index.css'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(Button)
app.use(NavBar)
app.use(Tabbar)
app.use(TabbarItem)
app.use(Cell)
app.use(Icon)
app.use(Image)
app.use(Lazyload)
app.use(Swipe)
app.use(SwipeItem)
app.use(Toast)
app.use(Popup)
app.use(Field)

app.mount('#app')
