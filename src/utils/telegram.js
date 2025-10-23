// Утилиты для работы с Telegram Mini App

export function getTelegramUserId() {
  const tg = window.Telegram?.WebApp
  
  if (!tg) {
    console.warn('⚠️ Telegram WebApp не найден. Используется demo_user')
    return 'demo_user'
  }

  const userId = tg.initDataUnsafe?.user?.id
  
  if (!userId) {
    console.warn('⚠️ Telegram user ID не найден. Используется demo_user')
    console.log('Telegram initDataUnsafe:', tg.initDataUnsafe)
    return 'demo_user'
  }

  console.log('✅ Telegram user ID:', userId)
  return String(userId)
}

export function getTelegramUser() {
  const tg = window.Telegram?.WebApp
  return tg?.initDataUnsafe?.user || null
}

export function isTelegramWebApp() {
  return !!window.Telegram?.WebApp
}

