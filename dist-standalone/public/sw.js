// Service Worker untuk E-Ijazah PWA
const CACHE_NAME = 'e-ijazah-v2.0.0';
const OFFLINE_CACHE = 'e-ijazah-offline-v1';

// Files to cache for offline functionality
const CORE_FILES = [
  './',
  './E-ijazah.html',
  './style.css',
  './script.js',
  './security-utils.js',
  './backup-manager.js',
  './performance-monitor.js',
  './theme-manager.js',
  './manifest.json'
];

// External resources (optional caching)
const EXTERNAL_RESOURCES = [
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Times+New+Roman&display=swap'
];

// Install event - cache core files
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache core files
      caches.open(CACHE_NAME).then(cache => {
        console.log('Service Worker: Caching core files');
        return cache.addAll(CORE_FILES).catch(err => {
          console.warn('Some core files failed to cache:', err);
          // Continue even if some files fail
        });
      }),
      
      // Cache external resources (optional)
      caches.open(OFFLINE_CACHE).then(cache => {
        console.log('Service Worker: Caching external resources');
        return Promise.allSettled(
          EXTERNAL_RESOURCES.map(url => 
            cache.add(url).catch(err => {
              console.warn(`Failed to cache ${url}:`, err);
            })
          )
        );
      })
    ]).then(() => {
      console.log('Service Worker: Installation complete');
      self.skipWaiting(); // Force activation
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Delete old caches
          if (cacheName !== CACHE_NAME && cacheName !== OFFLINE_CACHE) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Activated');
      return self.clients.claim(); // Take control immediately
    })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Skip non-GET requests and chrome-extension URLs
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }
  
  // Handle different types of requests
  if (url.origin === location.origin) {
    // Same-origin requests (our app files)
    event.respondWith(handleSameOriginRequest(request));
  } else {
    // External requests (CDN, fonts, etc.)
    event.respondWith(handleExternalRequest(request));
  }
});

// Handle same-origin requests with cache-first strategy
async function handleSameOriginRequest(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('Service Worker: Serving from cache:', request.url);
      return cachedResponse;
    }
    
    // If not in cache, fetch from network
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
      console.log('Service Worker: Cached new resource:', request.url);
    }
    
    return networkResponse;
  } catch (error) {
    console.warn('Service Worker: Network request failed:', request.url, error);
    
    // Return offline page for navigation requests
    if (request.destination === 'document') {
      return getOfflinePage();
    }
    
    // Return cached version if available
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return minimal error response
    return new Response('Offline', { 
      status: 503, 
      statusText: 'Service Unavailable' 
    });
  }
}

// Handle external requests with network-first strategy
async function handleExternalRequest(request) {
  try {
    // Try network first for external resources
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(OFFLINE_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.warn('Service Worker: External request failed:', request.url, error);
    
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('Service Worker: Using cached external resource:', request.url);
      return cachedResponse;
    }
    
    // Return error response
    return new Response('External Resource Unavailable', { 
      status: 503, 
      statusText: 'Service Unavailable' 
    });
  }
}

// Generate offline page
async function getOfflinePage() {
  const offlineHTML = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>E-Ijazah - Offline</title>
      <style>
        body {
          font-family: 'Poppins', Arial, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          margin: 0;
          background: linear-gradient(135deg, #1e8e3e, #28a745);
          color: white;
          text-align: center;
        }
        .offline-container {
          max-width: 400px;
          padding: 40px;
          background: rgba(255,255,255,0.1);
          border-radius: 20px;
          backdrop-filter: blur(10px);
        }
        .offline-icon {
          font-size: 48px;
          margin-bottom: 20px;
        }
        h1 {
          margin-bottom: 10px;
          font-size: 24px;
        }
        p {
          margin-bottom: 30px;
          opacity: 0.9;
          line-height: 1.6;
        }
        .retry-btn {
          background: white;
          color: #1e8e3e;
          border: none;
          padding: 12px 24px;
          border-radius: 25px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
        }
        .retry-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        }
        .features {
          margin-top: 30px;
          text-align: left;
          opacity: 0.8;
        }
        .features ul {
          list-style: none;
          padding: 0;
        }
        .features li {
          margin-bottom: 8px;
        }
        .features li::before {
          content: "✓ ";
          margin-right: 8px;
        }
      </style>
    </head>
    <body>
      <div class="offline-container">
        <div class="offline-icon">📚</div>
        <h1>E-Ijazah Offline</h1>
        <p>Tidak ada koneksi internet. Beberapa fitur tetap tersedia offline.</p>
        
        <button class="retry-btn" onclick="window.location.reload()">
          Coba Lagi
        </button>
        
        <div class="features">
          <h3>Fitur Offline:</h3>
          <ul>
            <li>Lihat data tersimpan</li>
            <li>Edit data lokal</li>
            <li>Backup otomatis</li>
            <li>Ganti tema</li>
          </ul>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return new Response(offlineHTML, {
    headers: { 'Content-Type': 'text/html' }
  });
}

// Background sync for data when online
self.addEventListener('sync', event => {
  console.log('Service Worker: Background sync triggered:', event.tag);
  
  if (event.tag === 'backup-sync') {
    event.waitUntil(syncBackupData());
  }
});

// Sync backup data when connection is restored
async function syncBackupData() {
  try {
    console.log('Service Worker: Syncing backup data...');
    
    // Notify main thread about sync
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_BACKUP_DATA',
        timestamp: Date.now()
      });
    });
    
  } catch (error) {
    console.error('Service Worker: Backup sync failed:', error);
  }
}

// Push notifications (for future use)
self.addEventListener('push', event => {
  console.log('Service Worker: Push message received');
  
  const options = {
    body: event.data ? event.data.text() : 'Ada update baru untuk E-Ijazah!',
    icon: './manifest.json',
    badge: './manifest.json',
    vibrate: [200, 100, 200],
    tag: 'e-ijazah-notification',
    actions: [
      {
        action: 'open',
        title: 'Buka Aplikasi'
      },
      {
        action: 'close',
        title: 'Tutup'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('E-Ijazah', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  console.log('Service Worker: Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow('./')
    );
  }
});

// Error handling
self.addEventListener('error', event => {
  console.error('Service Worker: Error occurred:', event.error);
});

self.addEventListener('unhandledrejection', event => {
  console.error('Service Worker: Unhandled promise rejection:', event.reason);
});

console.log('Service Worker: Script loaded');