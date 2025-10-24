import { defineStore } from 'pinia'
import { loadCatalog, getLists } from '../api/googleApi'
import { getTelegramUserId } from '../utils/telegram'

export const useCatalogStore = defineStore('catalog', {
  state: () => ({
    // Данные каталога
    stores: [],
    categories: [],
    catalog: [],
    
    // Данные списков пользователя
    userLists: [],
    currentUserId: null, // ID пользователя, для которого загружены списки
    
    // Флаги загрузки
    isLoadingCatalog: false,
    isLoadingLists: false,
    
    // Флаг, что данные уже загружены
    catalogLoaded: false,
    listsLoaded: false,
    
    // Время последней загрузки (для инвалидации кэша)
    catalogLoadedAt: null,
    listsLoadedAt: null,
  }),
  
  getters: {
    // Получить магазин по ID
    getStoreById: (state) => (id) => {
      return state.stores.find(s => s.id === id)
    },
    
    // Получить категорию по ID
    getCategoryById: (state) => (id) => {
      return state.categories.find(c => c.id === id)
    },
    
    // Получить товар по ID
    getProductById: (state) => (id) => {
      return state.catalog.find(p => p.id === id)
    },
  },
  
  actions: {
    // Загрузить каталог (с кэшированием)
    async fetchCatalog(forceReload = false) {
      // Если данные уже загружены и не требуется принудительная перезагрузка
      if (this.catalogLoaded && !forceReload) {
        console.log('📦 Используем закэшированный каталог')
        return { stores: this.stores, categories: this.categories, catalog: this.catalog }
      }
      
      // Если уже идёт загрузка, ждём её завершения
      if (this.isLoadingCatalog) {
        console.log('⏳ Каталог уже загружается, ожидаем...')
        // Ждём, пока загрузка завершится
        while (this.isLoadingCatalog) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
        return { stores: this.stores, categories: this.categories, catalog: this.catalog }
      }
      
      this.isLoadingCatalog = true
      
      try {
        console.log('🔄 Загружаем каталог с сервера...')
        const data = await loadCatalog()
        
        this.stores = data.stores || []
        this.categories = data.categories || []
        this.catalog = data.catalog || []
        this.catalogLoaded = true
        this.catalogLoadedAt = Date.now()
        
        console.log('✅ Каталог загружен:', {
          stores: this.stores.length,
          categories: this.categories.length,
          products: this.catalog.length
        })
        
        return data
      } catch (error) {
        console.error('❌ Ошибка загрузки каталога:', error)
        throw error
      } finally {
        this.isLoadingCatalog = false
      }
    },
    
    // Загрузить списки пользователя (с кэшированием)
    async fetchUserLists(forceReload = false) {
      const userId = getTelegramUserId()
      
      // Проверяем, изменился ли пользователь
      if (this.currentUserId !== userId) {
        console.log(`👤 Пользователь изменился: ${this.currentUserId} → ${userId}`)
        // Инвалидируем кэш при смене пользователя
        this.invalidateLists()
        this.currentUserId = userId
      }
      
      // Если данные уже загружены и не требуется принудительная перезагрузка
      if (this.listsLoaded && !forceReload) {
        console.log(`📋 Используем закэшированные списки для пользователя ${userId}`)
        return this.userLists
      }
      
      // Если уже идёт загрузка, ждём её завершения
      if (this.isLoadingLists) {
        console.log('⏳ Списки уже загружаются, ожидаем...')
        while (this.isLoadingLists) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
        return this.userLists
      }
      
      this.isLoadingLists = true
      
      try {
        console.log(`🔄 Загружаем списки пользователя ${userId} с сервера...`)
        const response = await getLists(userId)
        
        this.userLists = response.lists || []
        this.currentUserId = userId
        this.listsLoaded = true
        this.listsLoadedAt = Date.now()
        
        console.log(`✅ Списки загружены для пользователя ${userId}:`, this.userLists.length)
        
        return this.userLists
      } catch (error) {
        console.error('❌ Ошибка загрузки списков:', error)
        throw error
      } finally {
        this.isLoadingLists = false
      }
    },
    
    // Инвалидировать кэш каталога
    invalidateCatalog() {
      this.catalogLoaded = false
      this.catalogLoadedAt = null
    },
    
    // Инвалидировать кэш списков
    invalidateLists() {
      this.listsLoaded = false
      this.listsLoadedAt = null
      this.userLists = []
      this.currentUserId = null
    },
    
    // Обновить конкретный список в кэше
    updateListInCache(updatedList) {
      const index = this.userLists.findIndex(l => l.list_id === updatedList.list_id)
      if (index !== -1) {
        this.userLists[index] = updatedList
      }
    },
    
    // Удалить список из кэша
    removeListFromCache(listId) {
      this.userLists = this.userLists.filter(l => l.list_id !== listId)
    },
    
    // Добавить новый список в кэш
    addListToCache(newList) {
      this.userLists.push(newList)
    },
  }
})

