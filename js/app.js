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

  // Background Sync Loop - Pull updates every 5 seconds
  setInterval(() => {
    const user = DB.getCurrentUser();
    if (user) {
      DB.syncWithServer((syncedDb) => {
        UI.refreshActiveView(user);
      });
    }
  }, 5000);
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
  if ('serviceWorker' in navigator) {
    // Try to register service worker
    window.addEventListener('load', () => {
      // Create a dummy service worker inline if needed, or register a simple sw file.
      // Since offline is not requested, this just aids PWA installation.
      navigator.serviceWorker.register('./sw.js')
        .then(reg => console.log('PWA ServiceWorker registered successfully', reg.scope))
        .catch(err => console.warn('PWA ServiceWorker registration failed', err));
    });
  }
}
