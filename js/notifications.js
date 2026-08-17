const PUSH_FUNCTION_URL = 'https://qadsqfhvrhdmpjpexews.supabase.co/functions/v1/push-notifications';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_oRsfH9QxhIk8yGeDN_gApw_8LZNO5zX';
const VAPID_PUBLIC_KEY = 'BGQrvG_BhPBfJPhJuuFcXdme5WzQCOuS8ziBrof_WeCfJyihbbMtC-jJNlNojryR_8cdWCNcmeR85Fc18W1WnZA';

function base64UrlToUint8Array(value) {
  const padding = '='.repeat((4 - value.length % 4) % 4);
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const result = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) result[i] = raw.charCodeAt(i);
  return result;
}

function detectPlatform() {
  const ua = navigator.userAgent || '';
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  if (/Windows/.test(ua)) return 'windows';
  return 'other';
}

async function callPushFunction(body) {
  const response = await fetch(PUSH_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`
    },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    let detail = '';
    try { detail = (await response.json()).error || ''; } catch (_) { /* ignore */ }
    throw new Error(detail || `Máy chủ thông báo trả về lỗi ${response.status}.`);
  }
  return response.json();
}

export const PushNotifications = {
  registration: null,

  isSupported() {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  },

  isIos() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent || '');
  },

  isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  },

  async registerServiceWorker() {
    if (!this.isSupported()) return null;
    if (!this.registration) {
      this.registration = await navigator.serviceWorker.register('./sw.js', { scope: './' });
      await navigator.serviceWorker.ready;
    }
    return this.registration;
  },

  async getSubscription() {
    const registration = await this.registerServiceWorker();
    return registration ? registration.pushManager.getSubscription() : null;
  },

  async isEnabled() {
    if (!this.isSupported() || Notification.permission !== 'granted') return false;
    return !!(await this.getSubscription());
  },

  async subscribe(user) {
    if (!this.isSupported()) {
      throw new Error('Thiết bị hoặc trình duyệt này chưa hỗ trợ thông báo đẩy.');
    }
    if (this.isIos() && !this.isStandalone()) {
      throw new Error('Trên iPhone, hãy chọn Chia sẻ → Thêm vào Màn hình chính, sau đó mở ứng dụng từ biểu tượng mới.');
    }

    const permissionBeforeRequest = Notification.permission;
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      if (permission === 'denied') {
        throw new Error('Trình duyệt đang chặn thông báo. Hãy bấm biểu tượng ổ khóa bên trái địa chỉ web → Thông báo → Cho phép, rồi tải lại trang.');
      }
      throw new Error('Quyền thông báo chỉ được cấp tạm thời hoặc chưa được xác nhận. Hãy chọn “Luôn cho phép” khi trình duyệt hỏi lại.');
    }

    const registration = await this.registerServiceWorker();
    let subscription = await registration.pushManager.getSubscription();
    // Chrome/Edge can retain an expired PushSubscription after the user chose
    // "allow until browser closes". Recreate it when permission is granted
    // again so the push service returns a fresh, usable endpoint.
    if (subscription && permissionBeforeRequest !== 'granted') {
      try { await subscription.unsubscribe(); } catch (_) { /* stale already */ }
      subscription = null;
    }
    if (!subscription) {
      try {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: base64UrlToUint8Array(VAPID_PUBLIC_KEY)
        });
      } catch (error) {
        throw new Error('Không tạo được đăng ký thông báo mới. Hãy đặt quyền Thông báo của trang thành “Cho phép”, tải lại trang rồi nhấn chuông lần nữa.');
      }
    }

    await callPushFunction({
      action: 'subscribe',
      user_id: user.id,
      subscription: subscription.toJSON(),
      platform: detectPlatform()
    });
    localStorage.setItem('mtp_push_enabled_user', user.id);
    localStorage.setItem('mtp_push_permission_granted', '1');
    return subscription;
  },

  async unsubscribe(user) {
    const subscription = await this.getSubscription();
    if (subscription) {
      try {
        await callPushFunction({ action: 'unsubscribe', user_id: user.id, endpoint: subscription.endpoint });
      } finally {
        // A temporary server/network failure must not prevent the user from
        // resetting a broken local subscription.
        await subscription.unsubscribe();
      }
    }
    localStorage.removeItem('mtp_push_enabled_user');
    localStorage.removeItem('mtp_push_permission_granted');
  },

  async syncExistingSubscription(user) {
    if (!this.isSupported() || Notification.permission !== 'granted') {
      localStorage.removeItem('mtp_push_permission_granted');
      return false;
    }
    const subscription = await this.getSubscription();
    if (!subscription) return false;
    await callPushFunction({
      action: 'subscribe',
      user_id: user.id,
      subscription: subscription.toJSON(),
      platform: detectPlatform()
    });
    localStorage.setItem('mtp_push_enabled_user', user.id);
    localStorage.setItem('mtp_push_permission_granted', '1');
    return true;
  },

  async emitEvent(event, payload) {
    try {
      await callPushFunction({ action: 'event', event, ...payload });
      return true;
    } catch (error) {
      // A failed notification must never block the business operation itself.
      console.warn('Push notification event failed:', error);
      return false;
    }
  }
};
