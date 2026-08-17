import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') || '';
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') || '';
const CRON_SECRET = Deno.env.get('CRON_SECRET') || '';
const APP_ORIGIN = 'https://tran-tungduong.github.io';
const APP_PATH = '/Bao-cao-Moc-Tien-Phat/';

const corsHeaders = {
  'Access-Control-Allow-Origin': APP_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Vary': 'Origin'
};

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

webpush.setVapidDetails(APP_ORIGIN, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

function safeText(value: unknown, fallback: string) {
  const text = String(value || '').trim();
  return text ? text.slice(0, 180) : fallback;
}

async function findRecord(table: string, columns: string, id: unknown) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const { data, error } = await supabase.from(table).select(columns).eq('id', id).maybeSingle();
    if (error) throw error;
    if (data) return data;
    if (attempt < 3) await new Promise(resolve => setTimeout(resolve, 300));
  }
  return null;
}

async function sendToUsers(userIds: string[], payload: Record<string, string>) {
  const uniqueUsers = [...new Set(userIds.filter(Boolean))];
  if (!uniqueUsers.length) return { sent: 0, failed: 0 };

  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('id,endpoint,p256dh,auth')
    .in('user_id', uniqueUsers)
    .eq('active', true);
  if (error) throw error;

  let sent = 0;
  let failed = 0;
  for (const subscription of subscriptions || []) {
    try {
      await webpush.sendNotification({
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth }
      }, JSON.stringify(payload), { TTL: 60 * 60 * 12, urgency: 'normal' });
      sent += 1;
    } catch (error) {
      failed += 1;
      const statusCode = Number((error as { statusCode?: number }).statusCode || 0);
      if (statusCode === 404 || statusCode === 410) {
        await supabase.from('push_subscriptions').update({ active: false, updated_at: new Date().toISOString() }).eq('id', subscription.id);
      } else {
        console.error('Push delivery failed', statusCode, String(error));
      }
    }
  }
  return { sent, failed };
}

async function handleEvent(body: Record<string, unknown>) {
  const event = String(body.event || '');
  if (event === 'project_created') {
    if (body.actor_id !== 'usr_hai') return json({ ignored: true });
    const project = await findRecord('projects', 'id,name', body.project_id);
    if (!project) return json({ error: 'Không tìm thấy công trình.' }, 404);
    return json(await sendToUsers(['usr_long'], {
      title: 'Công trình mới từ Hải Tạ',
      body: safeText(project.name, 'Có công trình mới cần xử lý.'),
      tag: `project-${project.id}`,
      url: `${APP_PATH}?project=${encodeURIComponent(project.id)}`
    }));
  }

  if (event === 'report_created') {
    const log = await findRecord('daily_logs', 'id,reporter_name,project_id', body.log_id);
    if (!log) return json({ error: 'Không tìm thấy báo cáo.' }, 404);
    const project = await findRecord('projects', 'name', log.project_id);
    return json(await sendToUsers(['usr_long', 'usr_hai', 'usr_luan'], {
      title: 'Có báo cáo mới',
      body: `${safeText(log.reporter_name, 'Nhân sự')} • ${safeText(project?.name, 'Công trình')}`,
      tag: `report-${log.id}`,
      url: `${APP_PATH}?project=${encodeURIComponent(log.project_id)}`
    }));
  }

  if (event === 'task_assigned') {
    const task = await findRecord('subtasks', 'id,title,assigned_to,project_id', body.task_id);
    if (!task || !task.assigned_to) return json({ ignored: true });
    const { data: worker } = await supabase.from('users').select('role').eq('id', task.assigned_to).maybeSingle();
    if (!worker || !['lead_worker', 'assistant_worker'].includes(worker.role)) return json({ ignored: true });
    const project = await findRecord('projects', 'name', task.project_id);
    return json(await sendToUsers([task.assigned_to], {
      title: 'Bạn được giao nhiệm vụ mới',
      body: `${safeText(task.title, 'Nhiệm vụ mới')} • ${safeText(project?.name, 'Công trình')}`,
      tag: `task-${task.id}`,
      url: `${APP_PATH}?project=${encodeURIComponent(task.project_id)}`
    }));
  }

  return json({ error: 'Loại sự kiện không hợp lệ.' }, 400);
}

async function sendDailyReminder(request: Request) {
  if (!CRON_SECRET || request.headers.get('x-cron-secret') !== CRON_SECRET) {
    return json({ error: 'Cron không hợp lệ.' }, 401);
  }

  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short'
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  if (values.weekday === 'Sun') return json({ skipped: 'sunday' });
  const today = `${values.year}-${values.month}-${values.day}`;

  const { data: activeProjects, error: projectError } = await supabase.from('projects').select('id').eq('is_completed', false);
  if (projectError) throw projectError;
  const projectIds = (activeProjects || []).map(project => project.id);
  if (!projectIds.length) return json({ sent: 0, recipients: 0 });

  const { data: tasks, error: taskError } = await supabase
    .from('subtasks').select('assigned_to').in('project_id', projectIds).neq('status', 'completed').not('assigned_to', 'is', null);
  if (taskError) throw taskError;
  let workerIds = [...new Set((tasks || []).map(task => task.assigned_to).filter(Boolean))];

  if (workerIds.length) {
    const { data: reports } = await supabase.from('daily_logs').select('reporter_id').eq('date', today).in('reporter_id', workerIds);
    const alreadyReported = new Set((reports || []).map(report => report.reporter_id));
    workerIds = workerIds.filter(userId => !alreadyReported.has(userId));
  }

  const result = await sendToUsers(workerIds, {
    title: 'Nhắc báo cáo cuối ngày',
    body: 'Bạn đang có nhiệm vụ chưa hoàn thành. Hãy gửi báo cáo công việc hôm nay trước khi kết thúc ngày làm việc.',
    tag: `daily-report-${today}`,
    url: APP_PATH
  });
  return json({ ...result, recipients: workerIds.length });
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);

  try {
    const body = await request.json();
    if (body.action === 'subscribe') {
      const subscription = body.subscription || {};
      if (!body.user_id || !subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
        return json({ error: 'Đăng ký thiết bị không hợp lệ.' }, 400);
      }
      const { error } = await supabase.from('push_subscriptions').upsert({
        user_id: String(body.user_id), endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh, auth: subscription.keys.auth,
        platform: safeText(body.platform, 'other'), user_agent: request.headers.get('user-agent'),
        active: true, updated_at: new Date().toISOString()
      }, { onConflict: 'endpoint' });
      if (error) throw error;
      return json({ subscribed: true });
    }

    if (body.action === 'unsubscribe') {
      const { error } = await supabase.from('push_subscriptions').update({ active: false, updated_at: new Date().toISOString() })
        .eq('endpoint', body.endpoint).eq('user_id', body.user_id);
      if (error) throw error;
      return json({ unsubscribed: true });
    }

    if (body.action === 'event') return await handleEvent(body);
    if (body.action === 'daily_reminder') return await sendDailyReminder(request);
    return json({ error: 'Action không hợp lệ.' }, 400);
  } catch (error) {
    console.error(error);
    return json({ error: 'Không thể xử lý thông báo.' }, 500);
  }
});
