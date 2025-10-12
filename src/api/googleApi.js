import { API_BASE } from './config'

export function jsonp(url){
  return new Promise((resolve, reject)=>{
    const cb = 'cb_' + Math.random().toString(36).slice(2)
    window[cb] = (data)=>{ resolve(data); cleanup(); }
    const s = document.createElement('script')
    s.src = url + (url.includes('?') ? '&' : '?') + 'callback=' + cb
    s.onerror = ()=>{ reject(new Error('JSONP failed')); cleanup(); }
    function cleanup(){ delete window[cb]; s.remove(); }
    document.body.appendChild(s)
  })
}
export async function loadCatalog(){ return await jsonp(API_BASE + '?route=catalog') }
export async function makeOrder(user_id, items){
  const payload = { user_id, items }
  return await jsonp(API_BASE + '?route=order&data=' + encodeURIComponent(JSON.stringify(payload)))
}
