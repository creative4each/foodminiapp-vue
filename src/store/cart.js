import { defineStore } from 'pinia'
const STORAGE_KEY = 'foodminiapp_cart_v1'

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'),
    isLoadingList: false, // флаг загрузки списка
  }),
  getters: {
    list: (s) => Object.values(s.items),
    totalSum: (s) => Object.values(s.items).reduce((a, it) => a + Number(it.price||0)*Number(it.qty||0), 0),
    totalWeightKg: (s) => Object.values(s.items).reduce((a, it) => {
      const qty = Number(it.qty||0)
      if (it.unit === 'кг') return a + qty
      const w = Number(it.weight_per_unit||0)
      return a + (w ? qty * w : 0)
    }, 0),
    groupedByStore: (s) => {
      const m = {}
      for (const it of Object.values(s.items)) {
        if (!m[it.store_id]) m[it.store_id] = []
        m[it.store_id].push(it)
      }
      return m
    }
  },
  actions: {
    setFromCatalogItem(item, qty){
      const base = { id:item.id, title:item.title, unit:item.unit, price:item.price, weight_per_unit:item.weight_per_unit, store_id:item.store_id }
      this.items[item.id] = { ...base, qty: qty }
      this.persist()
    },
    inc(item, step=1){
      const cur = this.items[item.id]?.qty || 0
      const next = +(cur + step).toFixed(3)
      this.setFromCatalogItem(item, next)
    },
    dec(item, step=1){
      const cur = this.items[item.id]?.qty || 0
      const next = Math.max(0, +(cur - step).toFixed(3))
      if (next === 0) { delete this.items[item.id]; this.persist(); return }
      this.setFromCatalogItem(item, next)
    },
    remove(itemId){
      delete this.items[itemId]
      this.persist()
    },
    clear(){
      this.items = {}
      this.persist()
    },
    setLoadingList(value){
      this.isLoadingList = value
    },
    persist(){
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items))
    }
  }
})
