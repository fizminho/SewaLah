// PWA Service Worker Registration and Management
export const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) {
    console.log('Service Workers not supported');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/',
    });

    console.log('Service Worker registered:', registration);

    // Check for updates periodically
    setInterval(() => {
      registration.update();
    }, 60000);

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            notifyUpdate();
          }
        });
      }
    });

    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
  }
};

const notifyUpdate = () => {
  const message = document.createElement('div');
  message.className = 'pwa-update-notification';
  message.innerHTML = `
    <div style="
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #0078d4;
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 9999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    ">
      <p style="margin: 0 0 12px 0; font-weight: 500;">Update Available</p>
      <button onclick="window.location.reload()" style="
        background: white;
        color: #0078d4;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 500;
        margin-right: 8px;
      ">Reload</button>
      <button onclick="this.parentElement.parentElement.remove()" style="
        background: transparent;
        color: white;
        border: 1px solid white;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 500;
      ">Later</button>
    </div>
  `;
  document.body.appendChild(message);
};

export const isOnline = () => navigator.onLine;

export const onOnlineStatusChange = (callback: (isOnline: boolean) => void) => {
  window.addEventListener('online', () => callback(true));
  window.addEventListener('offline', () => callback(false));
};

export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('Notifications not supported');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

export const sendNotification = async (title: string, options?: NotificationOptions) => {
  if ('serviceWorker' in navigator && 'Notification' in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        ...options,
      });
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }
};

let deferredPrompt: any;

export const setupInstallPrompt = (onPromptReady?: () => void) => {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (onPromptReady) {
      onPromptReady();
    }
  });
};

export const showInstallPrompt = async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    deferredPrompt = null;
  }
};

export const isAppInstalled = () => {
  return window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true;
};

export const getAppVersion = () => {
  return '1.0.0';
};

export const initializePWA = async () => {
  await registerServiceWorker();
  setupInstallPrompt();
  await requestNotificationPermission();

  onOnlineStatusChange((isOnline) => {
    console.log(`App is now ${isOnline ? 'online' : 'offline'}`);
  });

  console.log('PWA initialized');
};
