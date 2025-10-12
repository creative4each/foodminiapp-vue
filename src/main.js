import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { router } from './router'
import App from './App.vue'
import './styles.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)

const tg = window.Telegram?.WebApp
if (tg) {
  const applyTheme = () => {
    const p = tg.themeParams || {}
    const set = (k, v) => document.documentElement.style.setProperty(k, v)
    set('--tg-bg', p.bg_color ? '#' + p.bg_color : '#ffffff')
    set('--tg-text', p.text_color ? '#' + p.text_color : '#111111')
    set('--tg-hint', p.hint_color ? '#' + p.hint_color : '#6b7280')
    set('--tg-link', p.link_color ? '#' + p.link_color : '#0ea5e9')
    set('--tg-secondary-bg', p.secondary_bg_color ? '#' + p.secondary_bg_color : '#ffffff')
    set('--tg-section-sep', p.section_separator_color ? '#' + p.section_separator_color : '#e5e7eb')
  }
  tg.ready(); tg.expand(); applyTheme(); tg.onEvent('themeChanged', applyTheme)
}

app.mount('#app')
