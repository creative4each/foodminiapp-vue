import { createRouter, createWebHashHistory } from 'vue-router'
import CatalogPage from './views/CatalogPage.vue'
import PlanPage from './views/PlanPage.vue'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: CatalogPage },
    { path: '/plan', component: PlanPage }
  ]
})
