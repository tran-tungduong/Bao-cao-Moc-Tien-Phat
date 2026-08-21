import { DB } from './db.js?v=20260821-attendance-tools';
import { UI } from './ui.js?v=20260821-attendance-tools';

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
      showConnectionBanner();
      checkSessionAndRoute();

      // Connect Realtime immediately. Outbound writes and new events can still
      // work while the heavier initial six-table refresh is being retried.
      DB.startLiveSync(() => {
        const u = DB.getCurrentUser();
        if (u) UI.refreshActiveView(u);
      }, () => {
        // WebSocket is online; the heavier full refresh can continue silently.
        removeConnectionBanner();
      });

      // Retry sequentially so slower iPhones never stack multiple full reads.
      let retryCount = 0;
      const retrySync = () => {
        retryCount++;
        DB.syncWithServer().then(resynced => {
          if (resynced) {
            removeConnectionBanner();
            const user = DB.getCurrentUser();
            if (user) UI.refreshActiveView(user);
          } else if (retryCount >= 20) {
            updateConnectionBanner('⚠️ Chưa tải được dữ liệu mới nhất — Nhấn nút đồng bộ để thử lại.');
          } else {
            setTimeout(retrySync, 15000);
          }
        }).catch(() => {
          if (retryCount < 20) setTimeout(retrySync, 15000);
        });
      };
      setTimeout(retrySync, 3000);
      return;
    }

    // Normal online path
    checkSessionAndRoute();
    DB.startLiveSync(() => {
      const user = DB.getCurrentUser();
      if (user) UI.refreshActiveView(user);
    });
  }).catch(error => {
    // Last-resort guard for older WebKit/private browsing storage failures.
    console.error('Application initialization failed:', error);
    const app = document.getElementById('app');
    if (app) {
      app.innerHTML = `
        <div class="initial-loader" style="gap:14px; text-align:center; padding:24px;">
          <div style="font-size:2rem;">⚠️</div>
          <div class="loader-text">Không thể khởi động ứng dụng</div>
          <p style="color:var(--text-muted); font-size:0.85rem; max-width:320px;">Trình duyệt đã chặn bộ nhớ hoặc kết nối dữ liệu. Hãy tắt chế độ duyệt riêng tư, kiểm tra mạng rồi thử lại.</p>
          <button type="button" class="btn-primary" onclick="window.location.reload()">Thử lại</button>
        </div>`;
    }
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
function showConnectionBanner() {
  if (document.getElementById('offline-mode-banner')) return;
  const banner = document.createElement('div');
  banner.id = 'offline-mode-banner';
  banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:999999;background:#D97706;color:#fff;text-align:center;padding:7px 16px;font-size:0.78rem;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;box-shadow:0 2px 8px rgba(0,0,0,0.3);';
  banner.innerHTML = navigator.onLine === false
    ? '⚠️ Thiết bị đang mất mạng — Đang dùng dữ liệu đã lưu trên máy...'
    : '⏳ Đang tải dữ liệu mới nhất từ máy chủ...';
  document.body.prepend(banner);
  // Never cover the application indefinitely when REST works but iOS blocks
  // or delays the Realtime WebSocket handshake. Background retries continue.
  if (navigator.onLine !== false) {
    setTimeout(() => removeConnectionBanner(), 12000);
  }
}

function updateConnectionBanner(message) {
  const banner = document.getElementById('offline-mode-banner');
  if (banner) banner.innerHTML = message;
}

function removeConnectionBanner() {
  const banner = document.getElementById('offline-mode-banner');
  if (banner) {
    banner.style.transition = 'opacity 0.4s ease';
    banner.style.opacity = '0';
    setTimeout(() => banner.remove(), 420);
  }
}

function registerServiceWorker() {
  // This worker only handles push events and does not cache/intercept app files.
  // Registering it is therefore safe on iOS while keeping deployments fresh.
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(error => {
      console.warn('Service Worker registration failed:', error);
    });
  }
}
