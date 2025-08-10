// Service Worker for Diet Plan Notifications
const CACHE_NAME = 'diet-plan-notifications-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker: Install event');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activate event');
  event.waitUntil(self.clients.claim());
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification click event', event);
  
  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};
  
  notification.close();
  
  if (action === 'view' || !action) {
    // Open the app when notification is clicked
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clients) => {
        // Check if app is already open
        for (const client of clients) {
          if (client.url.includes('/upload') && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window if app is not open
        if (self.clients.openWindow) {
          return self.clients.openWindow('/upload?tab=calendar');
        }
      })
    );
  } else if (action === 'dismiss') {
    // Just close the notification (already done above)
    console.log('Notification dismissed');
  }
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('Service Worker: Notification close event', event);
});

// Handle background sync (for future use)
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync event', event);
  
  if (event.tag === 'diet-plan-sync') {
    event.waitUntil(
      // Sync diet plan data when back online
      syncDietPlanData()
    );
  }
});

// Handle push messages (for future server-sent notifications)
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push event', event);
  
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      tag: data.tag || 'diet-plan-notification',
      data: data.data || {},
      requireInteraction: false,
      actions: [
        {
          action: 'view',
          title: 'View Details'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Sync function for future use
async function syncDietPlanData() {
  try {
    console.log('Syncing diet plan data...');
    // Future: Sync offline changes when back online
    return Promise.resolve();
  } catch (error) {
    console.error('Failed to sync diet plan data:', error);
    return Promise.reject(error);
  }
}

// Handle fetch events (for future caching)
self.addEventListener('fetch', (event) => {
  // For now, just let all requests pass through
  // Future: Add caching for offline support
});

console.log('Diet Plan Service Worker loaded successfully');