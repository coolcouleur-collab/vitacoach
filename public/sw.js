// ─── Service Worker Oravia — Notifications Push ───────────────────────────────
const CACHE = 'oravia-v1'

self.addEventListener('install', e => {
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(clients.claim())
})

// Réception d'une notification push
self.addEventListener('push', e => {
  let data = { title: 'Oravia', body: 'Un message de ton coach !', icon: '/icon-192.png', badge: '/icon-192.png' }
  try { if (e.data) data = { ...data, ...e.data.json() } } catch {}

  e.waitUntil(
    self.registration.showNotification(data.title, {
      body:    data.body,
      icon:    data.icon || '/icon-192.png',
      badge:   data.badge || '/icon-192.png',
      tag:     data.tag || 'oravia',
      data:    data.url ? { url: data.url } : {},
      vibrate: [200, 100, 200],
      actions: data.actions || [],
    })
  )
})

// Clic sur la notification → ouvre l'app
self.addEventListener('notificationclick', e => {
  e.notification.close()
  const url = e.notification.data?.url || '/'
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const existing = list.find(c => c.url.includes(self.location.origin))
      if (existing) return existing.focus()
      return clients.openWindow(url)
    })
  )
})
