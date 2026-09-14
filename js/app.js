import { DB } from './db.js?v=20260914-egress-phase1';
import { Toast } from './components.js?v=20260914-egress-phase1';
import { UI } from './ui.js?v=20260914-egress-phase1';

let pendingNotificationUrl = new URLSearchParams(window.location.search).has('project')
  ? window.location.href : null;

async function openPendingNotification() {
  const user = DB.getCurrentUser();
  if (!user || !pendingNotificationUrl) return;
  // Do not replace an open editor or a report form containing unsaved work.
  if (document.getElementById('app-modal') || document.querySelector('form')) {
    Toast.info('Có thông báo mới. Hãy hoàn tất nội dung đang nhập trước khi mở công trình.');
    return;
  }
  const target = new URL(pendingNotificationUrl, window.location.href);
  if (target.origin !== window.location.origin) return;
  pendingNotificationUrl = null;
  const projectId = target.searchParams.get('project');
  if (!projectId) return;
  if (Date.now() - (DB.lastReadAt || 0) > 30000) await DB.syncWithServer();
  if (DB.getCurrentUser()?.id !== user.id) return;
  if (!DB.getProjectsForUser(user).some(project => project.id === projectId)) {
    Toast.info('Công trình không còn trong danh sách bạn được xem.');
    return;
  }
  if (!document.getElementById('app-modal') && !document.querySelector('form')) {
    UI.openProjectDetailsDrawer(projectId, user, () => UI.refreshActiveView(user));
  }
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', event => {
    if (event.data?.type !== 'OPEN_NOTIFICATION' || typeof event.data.url !== 'string') return;
    pendingNotificationUrl = event.data.url;
    openPendingNotification().catch(console.warn);
  });
}

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

    if (!synced && hasCachedData) showConnectionBanner();
    checkSessionAndRoute();
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
    DB.startLiveSync(() => {
      const current = DB.getCurrentUser();
      if (current) UI.refreshActiveView(current);
      removeConnectionBanner();
    }, removeConnectionBanner);
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
  openPendingNotification().catch(console.warn);
}

// Offline mode banner — shown at top of screen when Supabase is unreachable
function showConnectionBanner() {
  if (document.getElementById('offline-mode-banner')) return;
  const banner = document.createElement('div');
  banner.id = 'offline-mode-banner';
  banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:999999;background:#D97706;color:#fff;text-align:center;padding:calc(7px + env(safe-area-inset-top,0px)) max(16px,env(safe-area-inset-right,0px)) 7px max(16px,env(safe-area-inset-left,0px));font-size:0.78rem;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;box-shadow:0 2px 8px rgba(0,0,0,0.3);';
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
