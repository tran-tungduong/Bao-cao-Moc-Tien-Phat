import { DB } from './db.js';
import { UI } from './ui.js';

// Application Initialization
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Theme
  const savedTheme = localStorage.getItem('furni_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);

  // Register Service Worker for PWA (Installability)
  registerServiceWorker();

  // Supabase is the source of truth. Only render once the first remote read
  // completes; localStorage is retained strictly as a recoverable cache.
  DB.initialize().then(synced => {
    if (!synced) {
      document.getElementById('app').innerHTML = `
        <div class="initial-loader" style="gap:14px; text-align:center; padding:24px;">
          <i class="fas fa-cloud-exclamation" style="font-size:2rem; color:var(--status-rejected);"></i>
          <div class="loader-text">Không thể kết nối máy chủ dữ liệu</div>
          <p style="color:var(--text-muted); font-size:0.85rem; max-width:300px;">Dữ liệu cũ trên máy vẫn được giữ an toàn, nhưng ứng dụng chỉ hoạt động khi đã tải dữ liệu mới nhất từ Supabase.</p>
          <button type="button" class="btn-primary" onclick="window.location.reload()">Thử kết nối lại</button>
        </div>`;
      return;
    }
    checkSessionAndRoute();
    DB.startLiveSync(() => {
      const user = DB.getCurrentUser();
      if (user) UI.refreshActiveView(user);
    });
  });
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
