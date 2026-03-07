// Service Worker for handling share target
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Handle share target requests
  if (url.pathname === '/task-manager/share' && event.request.method === 'POST') {
    event.respondWith(handleShare(event.request));
  }
});

async function handleShare(request) {
  const formData = await request.formData();
  const title = formData.get('title') || '';
  const text = formData.get('text') || '';
  const url = formData.get('url') || '';
  const media = formData.getAll('media');
  
  // Store the shared data
  const shareData = {
    title,
    text,
    url,
    files: media
  };
  
  // Redirect to main app with query parameters
  const params = new URLSearchParams();
  if (title) params.set('title', title);
  if (text) params.set('text', text);
  if (url) params.set('url', url);
  
  // Store files in cache for retrieval
  if (media.length > 0) {
    const cache = await caches.open('shared-files');
    await cache.put('/shared-data', new Response(JSON.stringify({
      files: await Promise.all(media.map(async file => ({
        name: file.name,
        type: file.type,
        data: await file.arrayBuffer()
      })))
    })));
  }
  
  return Response.redirect(`/task-manager/?${params.toString()}`, 303);
}

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(clients.claim());
});
