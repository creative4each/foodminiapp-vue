import { API_BASE } from './config'

export function jsonp(url, timeout = 15000){
  return new Promise((resolve, reject)=>{
    const cb = 'cb_' + Math.random().toString(36).slice(2)
    let timeoutId = null
    let cleaned = false
    
    window[cb] = (data)=>{ 
      if (!cleaned) {
        resolve(data)
        cleanup()
      }
    }
    
    const s = document.createElement('script')
    s.src = url + (url.includes('?') ? '&' : '?') + 'callback=' + cb
    s.onerror = ()=>{ 
      if (!cleaned) {
        reject(new Error('JSONP failed'))
        cleanup()
      }
    }
    
    // Таймаут для запроса
    timeoutId = setTimeout(() => {
      if (!cleaned) {
        reject(new Error('JSONP timeout'))
        cleanup()
      }
    }, timeout)
    
    function cleanup(){ 
      cleaned = true
      if (timeoutId) clearTimeout(timeoutId)
      delete window[cb]
      // Безопасное удаление скрипта
      if (s.parentNode) {
        s.parentNode.removeChild(s)
      }
    }
    
    // Используем document.head вместо document.body (head всегда доступен раньше)
    const target = document.head || document.getElementsByTagName('head')[0]
    target.appendChild(s)
  })
}
export async function loadCatalog(){ return await jsonp(API_BASE + '?route=catalog') }

export async function makeOrder(user_id, items){
  const payload = { user_id, items }
  return await jsonp(API_BASE + '?route=order&data=' + encodeURIComponent(JSON.stringify(payload)))
}

// === Lists API ===
export async function getLists(user_id){
  return await jsonp(API_BASE + '?route=lists&user_id=' + encodeURIComponent(user_id))
}

export async function createList(user_id, list_name, items, sum, total_weight_kg){
  // Принудительно преобразуем list_name в строку
  const payload = { 
    user_id, 
    list_name: String(list_name || ''), 
    items, 
    sum, 
    total_weight_kg 
  }
  const url = API_BASE + '?route=create_list&data=' + encodeURIComponent(JSON.stringify(payload))
  console.log('createList URL:', url)
  console.log('createList payload:', payload)
  return await jsonp(url)
}

export async function updateList(list_id, list_name, items, sum, total_weight_kg){
  // Принудительно преобразуем list_name в строку
  const payload = { 
    list_id, 
    list_name: String(list_name || ''), 
    items, 
    sum, 
    total_weight_kg 
  }
  return await jsonp(API_BASE + '?route=update_list&data=' + encodeURIComponent(JSON.stringify(payload)))
}

export async function deleteList(list_id){
  return await jsonp(API_BASE + '?route=delete_list&list_id=' + encodeURIComponent(list_id))
}

export async function loadList(list_id){
  return await jsonp(API_BASE + '?route=load_list&list_id=' + encodeURIComponent(list_id))
}

export async function listToOrder(list_id, user_id){
  return await jsonp(API_BASE + '?route=list_to_order&list_id=' + encodeURIComponent(list_id) + '&user_id=' + encodeURIComponent(user_id))
}
