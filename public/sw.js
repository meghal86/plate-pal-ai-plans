// Service Worker for Kids Meal Planner Notifications

const CACHE_NAME = 'kids-meal-planner-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/icon-192x192.png',
  '/badge-72x72.png'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const action = event.action;
  
  notification.close();
  
  if (action === 'view') {
    // Open the app to view the recipe
    event.waitUntil(
      clients.openWindow('/?tab=kids&subtab=school-meals')
    );
  } else if (action === 'dismiss') {
    // Just close the notification
    return;
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/?tab=kids')
    );
  }
});

// Background sync for offline functionality
self.addEventListener('sync', (event) => {
  if (event.tag === 'meal-plan-sync') {
    event.waitUntil(syncMealPlans());
  }
});

async function syncMealPlans() {
  try {
    // Sync any pending meal plan data when back online
    console.log('Syncing meal plans...');
    // Implementation would depend on your backend sync strategy
  } catch (error) {
    console.error('Failed to sync meal plans:', error);
  }
}

// Push event for server-sent notifications (if implemented)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      tag: data.tag || 'meal-reminder',
      data: data.data,
      actions: [
        {
          action: 'view',
          title: 'View Recipe',
          icon: '/icons/view.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss',
          icon: '/icons/dismiss.png'
        }
      ],
      requireInteraction: false,
      silent: false
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});