import { DB } from './db.js';
import { UI } from './ui.js';

// Application Initialization
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Theme
  const savedTheme = localStorage.getItem('furni_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);

  // Register Service Worker for PWA (Installability)
  registerServiceWorker();

  // Supabase is the primary source of truth.
  // If Supabase is unreachable but the device has a local cache, the app
  // still loads in offline mode so users are never blocked unnecessarily.
  DB.initialize().then(synced => {
    const hasCachedData = !!localStorage.getItem('furni_report_db');

    if (!synced && !hasCachedData) {
      // Truly first-run with no connectivity — nothing to show
      document.getElementById('app').innerHTML = `
        <div class="initial-loader" style="gap:14px; text-align:center; padding:24px;">
          <i class="fas fa-cloud-exclamation" style="font-size:2rem; color:var(--status-rejected);"></i>
          <div class="loader-text">Không thể kết nối máy chủ dữ liệu</div>
          <p style="color:var(--text-muted); font-size:0.85rem; max-width:300px;">Dữ liệu cũ trên máy vẫn được giữ an toàn, nhưng ứng dụng chỉ hoạt động khi đã tải dữ liệu mới nhất từ Supabase.</p>
          <button type="button" class="btn-primary" onclick="window.location.reload()">Thử kết nối lại</button>
        </div>`;
      return;
    }

    if (!synced && hasCachedData) {
      // Has local cache — load the app immediately in offline mode
      showOfflineBanner();
      checkSessionAndRoute();

      // Background retry every 15 seconds until Supabase is reachable
      let retryCount = 0;
      const retryInterval = setInterval(() => {
        retryCount++;
        DB.syncWithServer().then(resynced => {
          if (resynced) {
            clearInterval(retryInterval);
            removeOfflineBanner();
            const user = DB.getCurrentUser();
            if (user) UI.refreshActiveView(user);
            DB.startLiveSync(() => {
              const u = DB.getCurrentUser();
              if (u) UI.refreshActiveView(u);
            });
          } else if (retryCount >= 20) {
            clearInterval(retryInterval); // give up after ~5 min
          }
        });
      }, 15000);
      return;
    }

    // Normal online path
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

// Offline mode banner — shown at top of screen when Supabase is unreachable
function showOfflineBanner() {
  if (document.getElementById('offline-mode-banner')) return;
  const banner = document.createElement('div');
  banner.id = 'offline-mode-banner';
  banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:999999;background:#D97706;color:#fff;text-align:center;padding:7px 16px;font-size:0.78rem;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;box-shadow:0 2px 8px rgba(0,0,0,0.3);';
  banner.innerHTML = '⚠️ Đang dùng dữ liệu offline — Đang tự động thử kết nối lại...';
  document.body.prepend(banner);
}

function removeOfflineBanner() {
  const banner = document.getElementById('offline-mode-banner');
  if (banner) {
    banner.style.transition = 'opacity 0.4s ease';
    banner.style.opacity = '0';
    setTimeout(() => banner.remove(), 420);
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
