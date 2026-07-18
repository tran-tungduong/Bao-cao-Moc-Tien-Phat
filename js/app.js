import { DB } from './db.js';
import { UI } from './ui.js';

// Application Initialization
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Theme
  const savedTheme = localStorage.getItem('furni_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);

  // Initialize Database
  DB.load();
  
  // Register Service Worker for PWA (Installability)
  registerServiceWorker();

  // Check Session
  checkSessionAndRoute();

  // Perform initial API server sync
  DB.syncWithServer((syncedDb) => {
    const user = DB.getCurrentUser();
    if (user) {
      UI.refreshActiveView(user);
    }
  });

  // Background Sync Loop removed for manual sync button stability
});

function checkSessionAndRoute() {
  const user = DB.getCurrentUser();
  if (user) {
    // Render Application Shell
    UI.renderShell(user, 
      // On Logout callback
      () => {
        UI.renderLogin(checkSessionAndRoute);
      }
    );

    // Route based on role (Manager, KTS, Sales, Marketing see overview. Workers see worker view)
    if (['manager', 'kts', 'sales', 'marketing'].includes(user.role)) {
      UI.renderManagerView(user);
    } else {
      UI.renderWorkerView(user);
    }
  } else {
    // Render Login Form
    UI.renderLogin(checkSessionAndRoute);
  }
}

function registerServiceWorker() {
  // Clear any existing Service Workers and Cache Storage to prevent stale cached code
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      for (let registration of registrations) {
        registration.unregister().then(success => {
          if (success) console.log('Service Worker unregistered successfully.');
        });
      }
    });
  }
  if ('caches' in window) {
    caches.keys().then(keys => {
      keys.forEach(key => {
        caches.delete(key).then(() => {
          console.log(`Cache Storage '${key}' deleted successfully.`);
        });
      });
    });
  }
}
