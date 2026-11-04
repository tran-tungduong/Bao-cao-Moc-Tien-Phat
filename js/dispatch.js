// "Điều phối thợ" tab: daily crew dispatch + end-of-day report for the site
// coordinator (Nhật Long). Mirrors the Google Sheet layout: top = who works
// on what today (1 row per worker, more on demand), then the end-of-day report
// per project,
// auto-drafted from the workers' own reports in the app.
//
// Storage: one row per day in `crew_dispatch_days`, read on demand by date
// (a few KB) instead of joining the full-table live sync. Until that table
// exists the tab runs in "thử nghiệm" mode and keeps data in this browser only.
import { DB } from './db.js?v=20261104-dispatch17';
import { Toast, Modal } from './components.js?v=20260915-egress-phase2';
import { PushNotifications } from './notifications.js';

const TABLE = 'crew_dispatch_days';
const LOCAL_KEY = 'mtp_crew_dispatch_local_v1';
// Current crew, in display order (same list as the crew summary tab).
const CREW_IDS = ['usr_cuong', 'usr_ut', 'usr_minhnhat'];
const ATTENDANCE = ['Chưa xác nhận', 'Có làm', 'Tạm vắng', 'Nghỉ'];
// Pseudo-project for work that belongs to no project (dọn xưởng, chở ván…).
const WORKSHOP = '__workshop';
const WORKSHOP_LABEL = 'Xưởng / việc chung';
const RATINGS = ['Đúng tiến độ', 'Vượt tiến độ', 'Chậm tiến độ', 'Thay đổi kế hoạch'];
const EDIT_ROLES = ['kts', 'manager'];
const WORKER_ROLES = ['lead_worker', 'assistant_worker'];

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const shortName = name => String(name || '').replace(/\s*\([^)]*\)/g, '').trim() || 'Chưa rõ';
const norm = s => String(s || '').trim().toLocaleLowerCase('vi-VN').replace(/\s+/g, ' ');
const clone = v => JSON.parse(JSON.stringify(v));
const vnDate = (value = new Date()) => {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' })
    .formatToParts(value).map(x => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}`;
};
const shiftDate = (iso, days) => {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};
const dayText = iso => String(iso || '').split('-').reverse().join('/');
const stampText = iso => {
  if (!iso || Number.isNaN(Date.parse(iso))) return '';
  const f = new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })
    .formatToParts(new Date(iso));
  const g = Object.fromEntries(f.map(x => [x.type, x.value]));
  return `${g.hour}:${g.minute} ${g.day}/${g.month}`;
};
const isItemDone = it => it && (it.isCompleted === true || it.isCompleted === 'true' || Number(it.progress) === 100);
// "[Bếp - Cả phòng]: lắp ráp" -> { scope: 'Bếp', name: 'lắp ráp' }
const parseTaskTitle = title => {
  const m = String(title || '').match(/^\s*\[([^\]]+)\]:\s*(.*)$/s);
  if (!m) return { scope: '', name: String(title || '').trim() };
  return { scope: m[1].split(' - ').map(x => x.trim()).filter(x => x && norm(x) !== 'cả phòng').join(' · '), name: m[2].trim() };
};
const taskLabel = title => { const t = parseTaskTitle(title); return t.scope ? `${t.scope} · ${t.name}` : t.name; };
// Text shown/typed in the task box: "lắp tủ trên · Bếp"
// Room of a task title "[Bếp - Cả phòng]: …" -> "Bếp"
const taskRoom = title => { const m = String(title || '').match(/^\s*\[([^\]]+)\]/); return m ? m[1].split(' - ')[0].trim() : 'Chung'; };
const taskLabelForPick = title => { const t = parseTaskTitle(title); return t.scope ? `${t.name} · ${t.scope}` : t.name; };
// Rooms of a project: declared scope + rooms already used by its tasks.
const roomsOf = project => {
  const rooms = (project.scope || []).map(sc => String(sc.room || '').trim());
  (project.subtasks || []).forEach(t => { const m = String(t.title || '').match(/^\s*\[([^\]-]+)/); if (m) rooms.push(m[1].trim()); });
  rooms.push(...(DispatchView.extraRooms[project.id] || []));
  const list = [...new Set(rooms.filter(Boolean))];
  return list.length ? list : ['Chung'];
};
const splitTaskTitle = title => { const t = parseTaskTitle(title); return t.scope ? `${t.name} (${t.scope})` : t.name; };

// A dispatch row: project (or WORKSHOP) + either a linked task (kind 'task')
// or hand-written work (kind 'free'). `joint` = working on someone else's task today.
const emptyRow = () => ({ projectId: '', project: '', room: '', kind: '', taskId: '', task: '', joint: false, savedAt: '' });
const rowHasWork = r => !!(r && (r.taskId || r.task || r.projectId));
const emptyDay = date => ({ date, workers: {}, report: { status: 'Chưa gửi', rows: [], note: '' }, version: 0 });

function normalizeRow(r) {
  const row = { ...emptyRow(), ...(r || {}) };
  // Rows saved by the first version (Nơi làm + free text) become hand-written work.
  if (!row.kind && row.task) row.kind = row.taskId ? 'task' : 'free';
  if (!row.projectId && row.place === 'Xưởng') { row.projectId = WORKSHOP; row.project = WORKSHOP_LABEL; }
  delete row.place;
  return row;
}

function normalizeDay(day, date) {
  const d = day && typeof day === 'object' ? day : emptyDay(date);
  d.date = date;
  d.workers = d.workers && typeof d.workers === 'object' ? d.workers : {};
  Object.values(d.workers).forEach(w => {
    w.rows = (Array.isArray(w.rows) ? w.rows : []).map(normalizeRow);
    // Old 3-row days: drop trailing empty rows, keep at least one.
    while (w.rows.length > 1 && !rowHasWork(w.rows[w.rows.length - 1])) w.rows.pop();
    if (!w.rows.length) w.rows.push(emptyRow());
  });
  d.report = d.report && typeof d.report === 'object' ? d.report : {};
  d.report.status = d.report.status === 'Đã gửi' ? 'Đã gửi' : 'Chưa gửi';
  d.report.rows = Array.isArray(d.report.rows) ? d.report.rows : [];
  d.report.note = d.report.note || '';
  d.version = Number(d.version) || 0;
  return d;
}

function ensureWorker(day, id) {
  if (!day.workers[id]) day.workers[id] = { attendance: '', rows: [] };
  const w = day.workers[id];
  if (!w.rows.length) w.rows.push(emptyRow());
  return w;
}

// Put work into the worker's first empty row, or a new row.
function placeInRow(day, workerId, fields) {
  const w = ensureWorker(day, workerId);
  let i = w.rows.findIndex(r => !rowHasWork(r));
  if (i === -1) { w.rows.push(emptyRow()); i = w.rows.length - 1; }
  Object.assign(w.rows[i], fields, { savedAt: new Date().toISOString() });
}

// ---------------------------------------------------------------------------
// Task writes (shared with the Tiến Độ tab data: subtasks + project history)
// ---------------------------------------------------------------------------
const TaskOps = {
  createTask(projectId, room, item, name, workerId, user) {
    const db = DB.load();
    const project = db.projects.find(p => p.id === projectId);
    if (!project) throw new Error('Không tìm thấy công trình.');
    const title = `[${room} - ${item || 'Cả phòng'}]: ${name}`;
    const task = { id: 'sub_' + Math.random().toString(36).substr(2, 9), title, assignedTo: workerId, status: 'pending', type: 'normal' };
    project.subtasks = project.subtasks || [];
    project.subtasks.push(task);
    const worker = db.users.find(u => u.id === workerId);
    const hist = { timestamp: new Date().toISOString(), action: `Điều phối: tạo nhiệm vụ "${title}" (Giao cho: ${worker ? worker.name : 'Thợ'})`, user: user.name };
    project.history = project.history || [];
    project.history.push(hist);
    DB.save(db);
    DB.sbInsertSubtask(task, projectId).catch(e => { console.error(e); Toast.error('Chưa lưu được nhiệm vụ lên máy chủ: ' + e.message); });
    DB.sbInsertHistory(hist, projectId);
    PushNotifications.emitEvent('task_assigned', { task_id: task.id, project_id: projectId, actor_id: user.id });
    return task;
  },

  assignTask(projectId, taskId, workerId, user, verb = 'Phân công') {
    const db = DB.load();
    const project = db.projects.find(p => p.id === projectId);
    const task = project?.subtasks?.find(t => t.id === taskId);
    if (!task) throw new Error('Không tìm thấy nhiệm vụ.');
    const worker = db.users.find(u => u.id === workerId);
    task.assignedTo = workerId;
    const hist = { timestamp: new Date().toISOString(), action: `${verb} nhiệm vụ "${task.title}" cho: ${worker ? worker.name : 'Chưa rõ'} (từ Điều phối)`, user: user.name };
    project.history = project.history || [];
    project.history.push(hist);
    DB.save(db);
    DB.sbUpdateSubtask(taskId, { assigned_to: workerId }).catch(e => { console.error(e); Toast.error('Chưa lưu được phân công lên máy chủ: ' + e.message); });
    DB.sbInsertHistory(hist, projectId);
    PushNotifications.emitEvent('task_assigned', { task_id: taskId, project_id: projectId, actor_id: user.id });
  }
};

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------
export const DispatchStore = {
  mode: 'unknown', // 'cloud' | 'local'
  cache: new Map(),

  readLocal() {
    try { return JSON.parse(localStorage.getItem(LOCAL_KEY)) || {}; } catch { return {}; }
  },
  writeLocal(all) {
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(all)); } catch (e) { console.warn('Dispatch local save failed', e); }
  },
  isMissingTable(error) {
    return !!error && (error.code === '42P01' || error.code === 'PGRST205' || /does not exist|schema cache|Could not find the table/i.test(error.message || ''));
  },

  async load(date) {
    const client = DB.getClient();
    if (client && this.mode !== 'local') {
      const { data, error } = await client.from(TABLE).select('data,version,updated_at,updated_by').eq('date', date).maybeSingle();
      if (!error) {
        this.mode = 'cloud';
        const day = data
          ? normalizeDay({ ...(data.data || {}), version: data.version, updatedAt: data.updated_at, updatedBy: data.updated_by }, date)
          : emptyDay(date);
        this.cache.set(date, day);
        return day;
      }
      if (!this.isMissingTable(error)) throw error;
    }
    this.mode = 'local';
    const day = normalizeDay(clone(this.readLocal()[date] || emptyDay(date)), date);
    this.cache.set(date, day);
    return day;
  },

  // Report status of every saved day in a month ("YYYY-MM"), newest first.
  async listMonth(month) {
    const from = `${month}-01`, to = `${month}-31`;
    const pick = (date, report) => ({
      date, status: report?.status || 'Chưa gửi', sentAt: report?.sentAt || '', sentBy: report?.sentBy || '',
      rows: Number(report?.count ?? report?.snapshot?.count ?? report?.snapshot?.rows?.length) || 0,
      note: !!(report?.note ?? report?.snapshot?.note)
    });
    if (this.mode === 'local') {
      return Object.entries(this.readLocal()).filter(([d]) => d >= from && d <= to).sort((a, b) => b[0].localeCompare(a[0])).map(([d, v]) => pick(d, v.report));
    }
    const { data, error } = await DB.getClient().from(TABLE)
      .select('date, status:data->report->>status, sentAt:data->report->>sentAt, sentBy:data->report->>sentBy, count:data->report->snapshot->count, note:data->report->snapshot->>note')
      .gte('date', from).lte('date', to).order('date', { ascending: false });
    if (error) throw error;
    return (data || []).map(r => pick(r.date, r));
  },

  // Apply `fn` to the latest copy of the day and save it. Each edit is a small
  // patch re-applied on top of the newest version, so two people editing
  // different cells never overwrite each other.
  async mutate(date, fn, user) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const base = attempt === 0 && this.cache.has(date) ? this.cache.get(date) : await this.load(date);
      const next = normalizeDay(clone(base), date);
      fn(next);
      next.updatedAt = new Date().toISOString();
      next.updatedBy = user?.id || '';
      const version = (base.version || 0) + 1;

      if (this.mode === 'local') {
        next.version = version;
        const all = this.readLocal();
        all[date] = next;
        this.writeLocal(all);
        this.cache.set(date, next);
        return next;
      }

      const client = DB.getClient();
      const { date: _d, version: _v, updatedAt: _u, updatedBy: _b, ...data } = next;
      const payload = { data, version, updated_at: next.updatedAt, updated_by: next.updatedBy };
      const res = base.version
        ? await client.from(TABLE).update(payload).eq('date', date).eq('version', base.version).select('version')
        : await client.from(TABLE).insert({ date, ...payload }).select('version');
      if (!res.error && res.data && res.data.length) {
        next.version = version;
        this.cache.set(date, next);
        return next;
      }
      if (res.error && res.error.code !== '23505') throw res.error;
      this.cache.delete(date); // someone else saved first: reload and re-apply
    }
    throw new Error('Có người khác đang sửa cùng lúc. Vui lòng thử lại.');
  }
};

// ---------------------------------------------------------------------------
// Data derived from the app (projects, worker reports, attendance)
// ---------------------------------------------------------------------------
function readAppData(date) {
  const db = DB.load();
  const users = db.users || [];
  const usersById = new Map(users.map(u => [u.id, u]));
  const crew = CREW_IDS.map(id => usersById.get(id)).filter(Boolean);
  const projects = db.projects || [];
  const openProjects = projects.filter(p => !p.isCompleted).sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  const projectByName = new Map(projects.map(p => [norm(p.name), p]));
  const attendanceByUser = new Map((db.attendance || []).filter(a => a.date === date).map(a => [a.userId, a]));
  const taskById = new Map();
  projects.forEach(project => (project.subtasks || []).forEach(t => taskById.set(t.id, { task: t, project })));
  // What each worker reported per task on this day: `${workerId}|${taskId}` -> { done, pending }
  const taskReports = new Map();

  // Worker reports for the day, grouped by project.
  const reports = new Map(); // projectId -> { project, lines: [] }
  const reportCountByWorker = new Map();
  projects.forEach(project => (project.dailyLogs || []).forEach(log => {
    const role = usersById.get(log.reporterId)?.role || log.reporterRole;
    if (log.date !== date || !WORKER_ROLES.includes(role)) return;
    reportCountByWorker.set(log.reporterId, (reportCountByWorker.get(log.reporterId) || 0) + 1);
    if (!reports.has(project.id)) reports.set(project.id, { project, lines: [] });
    const items = Array.isArray(log.items) && log.items.length ? log.items : [null];
    items.forEach((item, idx) => {
      const scope = item ? [item.room, norm(item.item) === 'cả phòng' ? '' : item.item].filter(Boolean).join(' - ') : '';
      if (item && item.taskId) {
        const key = `${log.reporterId}|${item.taskId}`;
        const prev = taskReports.get(key) || { done: false, pending: '' };
        taskReports.set(key, { done: prev.done || isItemDone(item), pending: isItemDone(item) ? prev.pending : (item.pendingNotes || prev.pending) });
      }
      reports.get(project.id).lines.push({
        key: `log:${log.id}:${idx}`,
        taskId: item ? (item.taskId || '') : '',
        who: shortName(log.reporterName || usersById.get(log.reporterId)?.name),
        whoId: log.reporterId,
        time: stampText(log.createdAt || log.timestamp).split(' ')[0],
        scope,
        text: item ? (item.todayWork || '') : String(log.note || '').trim(),
        done: item ? isItemDone(item) : false,
        pending: item && !isItemDone(item) ? (item.pendingNotes || '') : '',
        expected: item && !isItemDone(item) ? String(item.expectedCompletionDate || log.expectedCompletionDate || '').slice(0, 10) : '',
        photos: (log.photos || []).length,
        stamp: log.createdAt || log.timestamp || ''
      });
    });
  }));
  reports.forEach(r => r.lines.sort((a, b) => String(a.stamp).localeCompare(String(b.stamp))));

  // Open work for planning: latest report per task up to the viewed date.
  const backlog = [];
  openProjects.forEach(project => (project.subtasks || []).forEach(task => {
    if (task.status === 'completed') return;
    let latest = null;
    (project.dailyLogs || []).forEach(log => {
      if (String(log.date) > date) return;
      (log.items || []).forEach(it => {
        if (it.taskId !== task.id) return;
        const key = `${log.date}|${log.createdAt || ''}`;
        if (!latest || key > latest.key) latest = { key, it, log };
      });
    });
    if (latest && isItemDone(latest.it)) return;
    const expected = latest ? String(latest.it.expectedCompletionDate || latest.log.expectedCompletionDate || '').slice(0, 10) : '';
    backlog.push({
      project,
      taskId: task.id,
      assigneeId: task.assignedTo || '',
      task: splitTaskTitle(task.title),
      assignee: shortName(usersById.get(task.assignedTo)?.name || ''),
      pending: latest ? (latest.it.pendingNotes || '') : '',
      expected,
      overdue: !!expected && expected < date,
      started: !!latest
    });
  }));
  backlog.sort((a, b) => (b.overdue - a.overdue) || (b.started - a.started) || a.project.name.localeCompare(b.project.name, 'vi'));

  return { users, usersById, crew, projects, openProjects, projectByName, attendanceByUser, reports, reportCountByWorker, backlog, taskById, taskReports };
}

// Draft for ONE worker report line: its own result, rating and what is left.
function draftForLine(l, date) {
  const result = `${l.scope ? `[${l.scope}] ` : ''}${l.text || 'Chưa ghi nội dung'}`;
  const rating = l.done ? 'Đúng tiến độ' : (l.expected && l.expected < date ? 'Chậm tiến độ' : '');
  const reason = l.pending ? `Còn: ${l.pending}` : '';
  return { result, rating, reason };
}

// Worker screen: load ONLY this worker's part of today's plan (a few hundred
// bytes, not the whole day with the report) and hand it to DB, so the worker
// can see and report the tasks dispatched to them.
export async function loadTodayDispatch(userId) {
  const date = vnDate();
  const client = DB.getClient();
  if (client && DispatchStore.mode !== 'local' && /^[\w-]+$/.test(userId || '')) {
    const { data, error } = await client.from(TABLE).select(`w:data->workers->${userId}`).eq('date', date).maybeSingle();
    if (!error) {
      DB.setDispatchGrants(date, data && data.w ? { [userId]: data.w } : {});
      return;
    }
    if (!DispatchStore.isMissingTable(error)) throw error;
  }
  const day = await DispatchStore.load(date);
  DB.setDispatchGrants(date, day.workers);
}

// ---------------------------------------------------------------------------
// View
// ---------------------------------------------------------------------------
export const DispatchView = {
  container: null,
  user: null,
  date: null,
  day: null,
  saveText: '',
  pendingRedraw: false,
  lastLoadAt: 0,
  lastRoom: {},      // last room used per project when creating tasks
  extraRooms: {},    // rooms typed via "Phòng khác…" (until a task uses them)
  pendingAssign: null, // { projectId, workerId } set by Tiến Độ "Giao việc"
  hideGiven: (() => { try { return localStorage.getItem('mtp_dispatch_hide_given') === '1'; } catch { return false; } })(),
  taskDrafts: {},      // `${workerId}|${row}` -> typed name not yet created
  newRoomFor: null,    // row showing the "new room" text box

  async render(container, user) {
    this.container = container;
    this.user = user;
    this.date = this.date || vnDate();
    container.innerHTML = '<div class="dsp-loading"><i class="fas fa-spinner fa-spin"></i> Đang tải điều phối…</div>';
    if (!this.focusHandler) {
      // Refresh on return to the window, but never while typing or saving (that would put back older data).
      this.focusHandler = () => { if (this.isMounted() && !this.saving && !this.isTyping() && !this.taskDraftsPending() && Date.now() - this.lastLoadAt > 120000) this.reload(); };
      window.addEventListener('focus', this.focusHandler);
    }
    await this.reload();
    this.applyPendingAssign();
  },

  // Coming from Tiến Độ "Giao việc": open today and put the project on that worker's row.
  applyPendingAssign() {
    const job = this.pendingAssign;
    this.pendingAssign = null;
    if (!job || !this.canEdit()) return;
    if (this.date !== vnDate()) { this.date = vnDate(); this.reload().then(() => { this.pendingAssign = job; this.applyPendingAssign(); }); return; }
    const project = DB.load().projects.find(p => p.id === job.projectId);
    if (!project) return;
    const rows = this.day.workers[job.workerId]?.rows || [];
    let i = rows.findIndex(r => r.projectId === project.id && !r.taskId && r.kind !== 'free');
    if (i === -1) i = rows.findIndex(r => !rowHasWork(r));
    if (i === -1) i = rows.length;
    this.save(day => {
      const w = ensureWorker(day, job.workerId);
      while (w.rows.length <= i) w.rows.push(emptyRow());
      Object.assign(w.rows[i], { projectId: project.id, project: project.name, kind: '', taskId: '', task: '', joint: false, savedAt: new Date().toISOString() });
    }).then(() => {
      const input = this.container?.querySelector(`.dsp-coord [data-w="${job.workerId}"][data-r="${i}"] [data-f="taskq"]`);
      if (input) { input.scrollIntoView({ block: 'center' }); input.focus(); }
    });
  },

  isMounted() {
    return !!(this.container && this.container.isConnected && this.container.querySelector('.dsp'));
  },

  canEdit() {
    return EDIT_ROLES.includes(this.user?.role);
  },

  async reload() {
    try {
      this.day = await DispatchStore.load(this.date);
      this.lastLoadAt = Date.now();
      const nextDate = shiftDate(this.date, 1);
      if (!this.nextDay || this.nextDay.date !== nextDate) {
        this.nextDay = null;
        DispatchStore.load(nextDate).then(d => { if (shiftDate(this.date, 1) === nextDate) this.nextDay = d; }).catch(() => {});
      }
      this.saveText = this.day.updatedAt ? `Đã lưu ${stampText(this.day.updatedAt).split(' ')[0]}` : 'Chưa có dữ liệu';
    } catch (error) {
      console.error(error);
      this.day = this.day && this.day.date === this.date ? this.day : emptyDay(this.date);
      this.saveText = 'Không tải được — kiểm tra mạng';
      Toast.error('Không tải được dữ liệu điều phối. Vui lòng thử lại.');
    }
    this.draw();
  },

  // Called when the app's live sync brings new worker reports.
  refresh() {
    if (!this.isMounted()) return;
    if (this.isTyping()) {
      this.pendingRedraw = true;
      return;
    }
    this.draw();
  },

  // True while the user is typing in a text box: a redraw would steal the caret.
  // Dropdowns are not "typing" — they redraw at once so colours update immediately.
  isTyping() {
    const el = document.activeElement;
    return !!(this.container && this.container.contains(el) && /INPUT|TEXTAREA/.test(el.tagName) && el.type !== 'date');
  },

  taskDraftsPending() {
    return Object.keys(this.taskDrafts).length > 0 || !!this.newRoomFor;
  },

  async save(fn) {
    if (!this.canEdit()) return;
    this.saving = (this.saving || 0) + 1;
    // Optimistic: show the change right away, then confirm with the server.
    const optimistic = normalizeDay(clone(this.day), this.date);
    fn(optimistic);
    this.day = optimistic;
    if (this.isTyping()) this.pendingRedraw = true; else this.draw();
    this.setStatus('Đang lưu…');
    try {
      this.day = await DispatchStore.mutate(this.date, fn, this.user);
      this.saveText = `Đã lưu ${stampText(this.day.updatedAt).split(' ')[0]}`;
      this.setStatus(this.saveText);
    } catch (error) {
      console.error(error);
      this.setStatus('Lưu thất bại');
      Toast.error(error.message || 'Lưu thất bại. Vui lòng thử lại.');
      this.saving--;
      await this.reload();
      return;
    }
    this.saving--;
  },

  setStatus(text) {
    const el = this.container?.querySelector('.dsp-save');
    if (el) el.textContent = `Đang xem ${dayText(this.date)} • ${text}`;
  },

  effectiveAttendance(app, id) {
    const saved = this.day.workers[id]?.attendance;
    if (saved) return { value: saved, auto: false };
    const rec = app.attendanceByUser.get(id);
    if (rec && rec.status === 'present') return { value: 'Có làm', auto: true };
    if (rec && rec.status === 'absent') return { value: 'Nghỉ', auto: true };
    // A worker who sent a report that day clearly worked.
    if (app.reportCountByWorker.get(id)) return { value: 'Có làm', auto: true };
    return { value: 'Chưa xác nhận', auto: false };
  },

  // End-of-day report: one row per worker report (even on the same project),
  // plus rows Nhật Long adds by hand. Edits are saved per row key.
  reportRows(app, day = this.day) {
    const snap = day.report.status === 'Đã gửi' ? day.report.snapshot : null;
    if (snap && Array.isArray(snap.rows)) {
      // Sent day: show the archived report as it was sent.
      let last = null;
      return snap.rows.map(r => {
        const first = r.project !== last;
        last = r.project;
        return {
          key: r.key, projectId: r.projectId, project: r.project, firstOfProject: first, archived: true,
          line: r.who ? { who: r.who, time: r.time, done: r.done, photos: r.photos, taskId: '' } : null,
          result: r.result, rating: r.rating, reason: r.reason, action: r.action,
          draft: { result: '', rating: '', reason: '' }
        };
      });
    }
    const saved = new Map(day.report.rows.map(r => [r.key, r]));
    const out = [];
    const groups = [...app.reports.values()].sort((a, b) => String(a.lines[0]?.stamp || '').localeCompare(String(b.lines[0]?.stamp || '')));
    groups.forEach(rep => rep.lines.forEach((line, n) => {
      const s = saved.get(line.key) || {};
      if (s.hidden) return;
      out.push({ ...s, key: line.key, projectId: rep.project.id, project: rep.project.name, line, firstOfProject: n === 0, draft: draftForLine(line, this.date) });
    }));
    // Hand-added rows ("Thêm công trình vào báo cáo").
    day.report.rows.filter(r => String(r.key).startsWith('extra-') && !r.hidden)
      .forEach(r => out.push({ ...r, firstOfProject: true, draft: { result: '', rating: '', reason: '' } }));
    // Report rows saved by the first version (one per project) are no longer shown.
    return out;
  },

  draw() {
    if (!this.container || !this.day) return;
    this.pendingRedraw = false;
    const app = readAppData(this.date);
    const editable = this.canEdit();
    const dis = editable ? '' : 'disabled';
    const sent = this.day.report.status === 'Đã gửi';
    const repDis = !editable || sent ? 'disabled' : '';
    const today = vnDate();

    // Summary line (same wording as the Sheet).
    const att = app.crew.map(u => this.effectiveAttendance(app, u.id).value);
    const count = v => att.filter(a => a === v).length;
    const assigned = app.crew.filter(u => (this.day.workers[u.id]?.rows || []).some(r => r.taskId || r.task)).length;
    const summary = `TRONG NGÀY • Có làm ${count('Có làm')}/${app.crew.length} • Tạm vắng ${count('Tạm vắng')} • Nghỉ ${count('Nghỉ')} • Chưa xác nhận ${count('Chưa xác nhận')} • Đã giao ${assigned}`;

    const projectSelect = (r) => {
      const known = r.projectId === WORKSHOP || app.openProjects.some(p => p.id === r.projectId);
      return `<select class="dsp-in" data-f="project" aria-label="Công trình" ${dis}>
        <option value="">— Chọn công trình —</option>
        <option value="${WORKSHOP}" ${r.projectId === WORKSHOP ? 'selected' : ''}>🏭 ${WORKSHOP_LABEL}</option>
        <optgroup label="Công trình đang chạy">${app.openProjects.map(p => `<option value="${esc(p.id)}" ${p.id === r.projectId ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</optgroup>
        ${!known && (r.projectId || r.project) ? `<option value="${esc(r.projectId || '')}" selected>${esc(r.project || 'Công trình cũ')}</option>` : ''}
      </select>`;
    };

    // Room first, then the task: the task list shows only open tasks of that room,
    // and "＋ Tạo" creates a new task there (owned by the worker) in one click.
    const taskLists = new Map();
    const taskListFor = (project, room) => {
      const id = `dsp-tl-${project.id}-${[...room].map(c => c.charCodeAt(0).toString(36)).join('')}`;
      if (!taskLists.has(id)) {
        const open = (project.subtasks || []).filter(t => t.status !== 'completed' && norm(taskRoom(t.title)) === norm(room));
        taskLists.set(id, `<datalist id="${esc(id)}">${open.map(t => {
          const owner = app.usersById.get(t.assignedTo);
          return `<option value="${esc(parseTaskTitle(t.title).name)}">${owner ? esc(shortName(owner.name)) : 'chưa giao'}</option>`;
        }).join('')}</datalist>`);
      }
      return id;
    };
    const rowRoom = (r, project) => {
      const linked = r.taskId ? app.taskById.get(r.taskId)?.task : null;
      if (linked) return taskRoom(linked.title);
      const rooms = roomsOf(project);
      if (r.room) return r.room;
      return this.lastRoom[project.id] && rooms.includes(this.lastRoom[project.id]) ? this.lastRoom[project.id] : rooms[0];
    };

    const roomCell = (u, r, i) => {
      if (!r.projectId) return '<select class="dsp-in" disabled aria-label="Phòng"><option>—</option></select>';
      if (r.projectId === WORKSHOP) return '<span class="dsp-muted dsp-na">Không cần</span>';
      const project = app.projects.find(p => p.id === r.projectId);
      if (!project) return '';
      if (this.newRoomFor === `${u.id}|${i}`) {
        return `<input class="dsp-in" data-f="roomnew" placeholder="Tên phòng mới, Enter" aria-label="Tên phòng mới" ${dis}>`;
      }
      const room = rowRoom(r, project);
      const rooms = roomsOf(project);
      if (room && !rooms.includes(room)) rooms.push(room);
      return `<select class="dsp-in" data-f="room" aria-label="Phòng" ${dis}>
        ${rooms.map(x => `<option ${x === room ? 'selected' : ''}>${esc(x)}</option>`).join('')}
        <option value="__other">＋ Phòng khác…</option></select>`;
    };

    const taskCell = (u, r, i) => {
      if (!r.projectId) return '<input class="dsp-in" disabled placeholder="Chọn công trình trước" aria-label="Nhiệm vụ">';
      const freeInput = `<input class="dsp-in dsp-free" data-f="free" value="${esc(r.task)}" placeholder="Ghi việc cần làm…" aria-label="Việc ghi tay" ${dis}>`;
      if (r.projectId === WORKSHOP || r.kind === 'free') return freeInput;
      const project = app.projects.find(p => p.id === r.projectId);
      if (!project) return `<input class="dsp-in" disabled value="${esc(r.task)}">`;
      const linked = r.taskId ? app.taskById.get(r.taskId)?.task : null;
      const draft = this.taskDrafts[`${u.id}|${i}`];
      const value = draft !== undefined ? draft : linked ? parseTaskTitle(linked.title).name : (r.task || '');
      const room = rowRoom(r, project);
      let note = '';
      if (linked && r.joint) {
        const owner = app.usersById.get(linked.assignedTo);
        note = `<small class="dsp-joint">Làm cùng · phụ trách: ${owner ? esc(shortName(owner.name)) : 'chưa rõ'}</small>`;
      } else if (r.taskId && !linked) {
        note = '<small class="dsp-muted">Nhiệm vụ đã bị xoá khỏi Tiến Độ</small>';
      }
      const button = linked && draft === undefined ? '' : `<button type="button" class="dsp-btn dsp-btn-primary dsp-create" data-create-task ${dis} title="Giao việc có sẵn hoặc tạo việc mới ở ${esc(room)}"><i class="fas fa-plus"></i> Tạo</button>`;
      return `<div class="dsp-taskline"><input class="dsp-in" data-f="taskq" list="${esc(taskListFor(project, room))}" value="${esc(value)}" placeholder="Gõ hoặc chọn việc" aria-label="Nhiệm vụ" autocomplete="off" ${dis}>${button}</div>${note}`;
    };

    const statusCell = (u, r) => {
      if (r.kind === 'free') return '<span class="dsp-st is-free">Việc ghi tay</span>';
      if (r.kind !== 'task' || !r.taskId) return '';
      const rep = app.taskReports.get(`${u.id}|${r.taskId}`);
      const task = app.taskById.get(r.taskId)?.task;
      if (rep?.done) return '<span class="dsp-st is-done">✅ Xong</span>';
      if (rep) return `<span class="dsp-st is-part">🟡 Đã báo cáo</span>${rep.pending ? `<small class="dsp-left">Còn: ${esc(rep.pending)}</small>` : ''}`;
      if (task?.status === 'completed') return '<span class="dsp-st is-done">✅ Đã xong</span>';
      return this.date <= vnDate() ? '<span class="dsp-st is-wait">⏳ Chưa báo cáo</span>' : '<span class="dsp-st is-plan">Kế hoạch</span>';
    };

    const attClass = value => ({ 'Có làm': 'att-on', 'Tạm vắng': 'att-away', 'Nghỉ': 'att-off' }[value] || 'att-none');
    const workerBlocks = app.crew.map(u => {
      const w = this.day.workers[u.id] || { rows: [emptyRow()] };
      const attendance = this.effectiveAttendance(app, u.id);
      const cls = attClass(attendance.value);
      const reported = app.reportCountByWorker.get(u.id) || 0;
      const workerCell = `<div class="dsp-cell dsp-c-worker"><b>${esc(shortName(u.name))}</b><small>${u.role === 'lead_worker' ? 'Thợ chính' : 'Thợ phụ'}${reported ? ` · <span class="dsp-ok">${reported} báo cáo</span>` : ''}</small></div>`;
      const attCell = `<div class="dsp-cell dsp-c-att"><select class="dsp-in dsp-att ${cls} ${attendance.auto ? 'is-auto' : ''}" data-f="attendance" aria-label="Đi làm của ${esc(shortName(u.name))}" ${dis}>
            ${ATTENDANCE.map(a => `<option ${a === attendance.value ? 'selected' : ''}>${a}</option>`).join('')}</select>
            ${attendance.auto ? '<small class="dsp-att-note">Tự nhận · bấm để xác nhận</small>' : cls === 'att-none' ? '<small class="dsp-att-note is-warn">Chưa chọn trạng thái</small>' : ''}</div>`;

      // Day off: collapse the worker to one line. Existing rows are kept, only hidden.
      if (attendance.value === 'Nghỉ') {
        const kept = w.rows.filter(rowHasWork).length;
        return `<div class="dsp-worker ${cls} is-collapsed">
          <div class="dsp-row" data-w="${esc(u.id)}" data-r="0">${workerCell}${attCell}
            <div class="dsp-cell dsp-c-off">Nghỉ hôm nay — không phân việc${kept ? ` <span class="dsp-muted">(đang ẩn ${kept} dòng đã phân công)</span>` : ''}</div>
          </div></div>`;
      }

      const rows = w.rows.map((r, i) => `<div class="dsp-row ${rowHasWork(r) ? 'is-filled' : ''}" data-w="${esc(u.id)}" data-r="${i}">
          ${i === 0 ? workerCell + attCell : '<div class="dsp-cell dsp-c-worker"></div><div class="dsp-cell dsp-c-att"></div>'}
          <div class="dsp-cell" data-label="Công trình">${projectSelect(r)}</div>
          <div class="dsp-cell" data-label="Phòng">${roomCell(u, r, i)}</div>
          <div class="dsp-cell dsp-c-task" data-label="Nhiệm vụ">${taskCell(u, r, i)}</div>
          <div class="dsp-cell dsp-c-status" data-label="Trạng thái">${statusCell(u, r)}</div>
          <div class="dsp-cell dsp-c-del">${editable && (w.rows.length > 1 || rowHasWork(r)) ? `<button type="button" class="dsp-icon-btn" data-delrow title="${w.rows.length > 1 ? 'Xoá dòng' : 'Xoá nội dung dòng'}" aria-label="Xoá dòng"><i class="fas fa-times"></i></button>` : ''}</div>
        </div>`).join('');
      const addRow = editable ? `<button type="button" class="dsp-addrow" data-addrow="${esc(u.id)}"><i class="fas fa-plus"></i> Thêm dòng cho ${esc(shortName(u.name))}</button>` : '';
      return `<div class="dsp-worker ${cls}">${rows}${addRow}</div>`;
    }).join('');
    const taskDatalists = [...taskLists.values()].join('');

    // Report alerts.
    const alerts = [];
    app.crew.forEach(u => {
      const a = this.effectiveAttendance(app, u.id).value;
      const n = app.reportCountByWorker.get(u.id) || 0;
      if (a === 'Có làm' && !n && this.date <= today) alerts.push(`<b>${esc(shortName(u.name))}</b> có làm nhưng chưa báo cáo`);
      if ((a === 'Nghỉ' || a === 'Tạm vắng') && n) alerts.push(`<b>${esc(shortName(u.name))}</b> đang ghi "${esc(a)}" nhưng có ${n} báo cáo`);
    });

    const rows = this.reportRows(app);
    const snapKeys = sent && this.day.report.snapshot ? new Set(this.day.report.snapshot.rows.map(r => r.key)) : null;
    const lateReports = snapKeys ? [...app.reports.values()].reduce((n, rep) => n + rep.lines.filter(l => !snapKeys.has(l.key)).length, 0) : 0;
    // Tasks each worker was dispatched to today, to tag reports outside the plan.
    const planned = new Map(Object.entries(this.day.workers).map(([id, w]) => [id, new Set(w.rows.filter(r => r.taskId).map(r => r.taskId))]));
    const outside = l => !!(l && l.taskId && planned.get(l.whoId)?.size && !planned.get(l.whoId).has(l.taskId));
    const reportRowsHtml = rows.map(r => {
      const val = f => (r[f] !== undefined ? r[f] : r.draft[f]) || '';
      const auto = f => r[f] === undefined && r.draft[f] ? 'is-auto' : '';
      const l = r.line;
      const projectCell = l
        ? `${r.firstOfProject ? `<b>${esc(r.project)}</b>` : ''}
          <span class="dsp-who"><b>${esc(l.who)}</b> · ${esc(l.time)}${l.photos ? ` · ${l.photos} ảnh` : ''}</span>
          ${l.done ? '<span class="dsp-ok">✓ Xong</span>' : '<span class="dsp-left">Chưa xong</span>'}${outside(l) ? ' <span class="dsp-tag">ngoài điều phối</span>' : ''}`
        : (!editable || sent ? `<b>${esc(r.project)}</b>` : `<input class="dsp-in" data-rf="project" list="dsp-projects" value="${esc(r.project)}" placeholder="Tên công trình" ${repDis}>`)
          + (!r.projectId && r.project ? '<small class="dsp-muted">Chưa có trong app</small>' : '');
      return `<div class="dsp-rrow ${l && r.firstOfProject ? 'is-first' : ''} ${l && !r.firstOfProject ? 'is-cont' : ''}" data-key="${esc(r.key)}">
        <div class="dsp-cell dsp-c-project" data-label="Công trình">${projectCell}</div>
        <div class="dsp-cell" data-label="Kết quả thực tế"><textarea class="dsp-in ${auto('result')}" data-rf="result" rows="${Math.min(6, Math.max(2, val('result').split('\n').length))}" placeholder="Kết quả thực tế" ${repDis}>${esc(val('result'))}</textarea></div>
        <div class="dsp-cell" data-label="Đánh giá"><select class="dsp-in ${auto('rating')} ${val('rating') === 'Chậm tiến độ' ? 'is-late' : ''}" data-rf="rating" ${repDis}>
          <option value="">—</option>${RATINGS.map(x => `<option ${x === val('rating') ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
        <div class="dsp-cell" data-label="Lý do / phát sinh"><textarea class="dsp-in ${auto('reason')}" data-rf="reason" rows="2" placeholder="Lý do / phát sinh" ${repDis}>${esc(val('reason'))}</textarea></div>
        <div class="dsp-cell" data-label="Hướng xử lý"><textarea class="dsp-in" data-rf="action" rows="2" placeholder="Hướng xử lý" ${repDis}>${esc(val('action'))}</textarea></div>
        <div class="dsp-cell dsp-c-saved">${r.updatedAt ? esc(stampText(r.updatedAt)) : (r.draft.result ? '<span class="dsp-auto-tag">Tự điền</span>' : '')}
          ${editable && !sent ? `<button type="button" class="dsp-icon-btn" data-hide="${esc(r.key)}" title="Bỏ dòng này khỏi báo cáo" aria-label="Bỏ dòng này khỏi báo cáo"><i class="fas fa-times"></i></button>` : ''}</div>
      </div>`;
    }).join('');

    // Who already has each backlog task on the viewed day.
    const givenTo = new Map();
    Object.entries(this.day.workers).forEach(([wid, w]) => {
      if (w.attendance === 'Nghỉ') return;
      w.rows.forEach(r => { if (r.taskId) givenTo.set(r.taskId, [...(givenTo.get(r.taskId) || []), shortName(app.usersById.get(wid)?.name)]); });
    });
    const hideGiven = this.hideGiven;
    const backlog = app.backlog
      .map(b => ({ ...b, given: givenTo.get(b.taskId) || [] }))
      .sort((a, b) => (a.given.length > 0) - (b.given.length > 0)); // not-yet-given first, original order kept
    const givenCount = backlog.filter(b => b.given.length).length;
    const shown = backlog.filter(b => !(hideGiven && b.given.length)).slice(0, 40);
    const backlogHtml = shown.map(b => `<div class="dsp-bl ${b.overdue ? 'is-overdue' : ''} ${b.given.length ? 'is-given' : ''}">
        ${b.given.length ? `<span class="dsp-given">✓ Đã giao: ${esc(b.given.join(', '))}</span>` : ''}
        <div class="dsp-bl-main"><b>${esc(b.task)}</b><span class="dsp-muted">${esc(b.project.name)}${b.assignee !== 'Chưa rõ' ? ` · phụ trách ${esc(b.assignee)}` : ''}</span>
          ${b.pending ? `<span class="dsp-left">Còn: ${esc(b.pending)}</span>` : ''}
          ${b.expected ? `<span class="${b.overdue ? 'dsp-late' : 'dsp-muted'}">${b.overdue ? 'Quá hạn' : 'Dự kiến'} ${esc(dayText(b.expected))}</span>` : (b.started ? '' : '<span class="dsp-muted">Chưa bắt đầu</span>')}</div>
        ${editable ? `<select class="dsp-in dsp-assign" data-bl="${esc(b.taskId)}" aria-label="Giao việc"><option value="">${b.given.length ? 'Giao thêm cho…' : 'Giao cho…'}</option>${app.crew.map(u => `<option value="${esc(u.id)}">${esc(shortName(u.name))}</option>`).join('')}</select>` : ''}
      </div>`).join('');

    this.container.innerHTML = `
      <section class="dsp fade-in">
        <div class="dsp-bar">
          <label class="dsp-date-label" for="dsp-date">Ngày xem</label>
          <div class="dsp-date">
            <button type="button" class="dsp-btn" data-nav="-1" aria-label="Ngày trước"><i class="fas fa-chevron-left"></i></button>
            <input type="date" id="dsp-date" class="dsp-in" value="${esc(this.date)}">
            <button type="button" class="dsp-btn" data-nav="1" aria-label="Ngày sau"><i class="fas fa-chevron-right"></i></button>
            <button type="button" class="dsp-btn" data-nav="today" ${this.date === today ? 'disabled' : ''}>Hôm nay</button>
          </div>
          <span class="dsp-save" aria-live="polite">Đang xem ${esc(dayText(this.date))} • ${esc(this.saveText)}</span>
          <button type="button" class="dsp-btn dsp-btn-primary" data-act="reload"><i class="fas fa-rotate"></i> Làm mới</button>
        </div>
        ${DispatchStore.mode === 'local' ? `<div class="dsp-mode"><i class="fas fa-flask"></i> Chế độ thử nghiệm: dữ liệu điều phối đang lưu trên trình duyệt này, chưa đồng bộ cho người khác.</div>` : ''}
        <datalist id="dsp-projects">${app.openProjects.map(p => `<option value="${esc(p.name)}"></option>`).join('')}</datalist>${taskDatalists}

        <div class="dsp-grid">
          <section class="dsp-panel dsp-coord">
            <header class="dsp-head"><h3>ĐIỀU PHỐI THỢ — TRONG NGÀY</h3>
</header>
            <p class="dsp-hint">Mỗi thợ 1 dòng, bấm "Thêm dòng" nếu cần · Nhiệm vụ chọn từ tab Tiến Độ, tạo mới hoặc ghi tay</p>
            <p class="dsp-summary">${esc(summary)}</p>
            <div class="dsp-table">
              <div class="dsp-row dsp-th"><div>Thợ</div><div>Đi làm</div><div>Công trình</div><div>Phòng</div><div>Nhiệm vụ</div><div>Trạng thái</div><div></div></div>
              ${workerBlocks || '<p class="dsp-muted">Chưa có thợ trong danh sách.</p>'}
            </div>
          </section>

          <section class="dsp-panel dsp-report ${sent ? 'is-sent' : ''}">
            <header class="dsp-head"><h3>BÁO CÁO CUỐI NGÀY</h3>
              <button type="button" class="dsp-btn" data-act="history"><i class="fas fa-clock-rotate-left"></i> Lịch sử báo cáo</button>
              <label class="dsp-send">Gửi báo cáo
                <select class="dsp-in ${sent ? 'is-sent' : 'is-pending'}" data-act="status" ${dis}>
                  <option ${!sent ? 'selected' : ''}>Chưa gửi</option><option ${sent ? 'selected' : ''}>Đã gửi</option></select></label></header>
            <p class="dsp-hint">${sent ? `Đã gửi ${esc(stampText(this.day.report.sentAt))}${this.day.report.sentBy ? ` bởi ${esc(shortName(app.usersById.get(this.day.report.sentBy)?.name))}` : ''}. Chuyển về "Chưa gửi" để sửa.` : 'Nhật Long tổng hợp và xác nhận sau khi gửi báo cáo. Ô viền vàng nhạt là tự điền từ báo cáo của thợ.'}</p>
            ${sent && this.day.report.snapshot ? `<p class="dsp-archived"><i class="fas fa-box-archive"></i> Đang xem bản đã lưu lúc gửi.${lateReports ? ` Có <b>${lateReports}</b> báo cáo mới sau khi gửi; chuyển về "Chưa gửi" để đưa vào.` : ''}</p>` : ''}
            <p class="dsp-warn">Chậm / thay đổi kế hoạch: điền lý do và hướng xử lý.</p>
            ${alerts.length ? `<ul class="dsp-alerts">${alerts.map(a => `<li><i class="fas fa-triangle-exclamation"></i> ${a}</li>`).join('')}</ul>` : ''}
            <div class="dsp-rtable">
              <div class="dsp-rrow dsp-th"><div>Công trình · Thợ</div><div>Kết quả thực tế</div><div>Đánh giá</div><div>Lý do / phát sinh</div><div>Hướng xử lý</div><div>Cập nhật</div></div>
              ${reportRowsHtml || '<p class="dsp-empty">Chưa có công trình nào trong ngày. Phân công thợ bên trái hoặc thêm công trình.</p>'}
            </div>
            ${editable && !sent ? '<button type="button" class="dsp-add" data-act="add-row"><i class="fas fa-plus"></i> Thêm công trình vào báo cáo</button>' : ''}
            <h4 class="dsp-subhead">GHI CHÚ CHUNG / ĐỀ XUẤT</h4>
            <textarea class="dsp-in dsp-note" data-act="note" rows="3" placeholder="Ghi chú chung, đề xuất cho ngày mai…" ${repDis}>${esc(this.day.report.note)}</textarea>
            <div class="dsp-actions"><button type="button" class="dsp-btn dsp-btn-primary" data-act="copy-text"><i class="fas fa-paper-plane"></i> Xem & gửi nhóm Zalo</button></div>
          </section>
        </div>

        <section class="dsp-panel dsp-backlog">
          <header class="dsp-head"><h3>VIỆC CÒN LẠI — dùng để điều phối</h3><span class="dsp-muted">${app.backlog.length} việc chưa xong · ${givenCount} đã giao ngày ${esc(dayText(this.date))}</span>
            <label class="dsp-toggle"><input type="checkbox" data-act="hide-given" ${hideGiven ? 'checked' : ''}> Ẩn việc đã giao</label></header>
          <p class="dsp-hint">"Giao cho…" đưa nhiệm vụ vào lịch của thợ trong ngày đang xem (không sao chép nhiệm vụ). Nếu nhiệm vụ đang do người khác phụ trách, app sẽ hỏi làm cùng hôm nay hay chuyển hẳn. Muốn xếp cho ngày mai, chuyển ngày xem sang ngày mai trước.</p>
          <div class="dsp-bl-list">${backlogHtml || `<p class="dsp-muted">${hideGiven && givenCount ? 'Mọi việc còn lại đều đã được giao trong ngày.' : 'Không còn việc tồn.'}</p>`}</div>
        </section>
      </section>`;

    this.bind(app, rows);
  },

  bind(app, rows) {
    const root = this.container;
    root.querySelector('#dsp-date').addEventListener('change', e => { if (e.target.value) { this.date = e.target.value; this.reload(); } });
    root.querySelectorAll('[data-nav]').forEach(btn => btn.addEventListener('click', () => {
      this.date = btn.dataset.nav === 'today' ? vnDate() : shiftDate(this.date, Number(btn.dataset.nav));
      this.reload();
    }));
    root.querySelector('[data-act="reload"]').addEventListener('click', () => { this.saveText = 'Đang tải…'; this.reload(); });
    root.querySelector('[data-act="history"]').addEventListener('click', () => this.openHistory());
    root.querySelector('[data-act="hide-given"]')?.addEventListener('change', e => {
      this.hideGiven = e.target.checked;
      try { localStorage.setItem('mtp_dispatch_hide_given', this.hideGiven ? '1' : ''); } catch { /* ignore */ }
      this.draw();
    });
    root.addEventListener('focusout', () => setTimeout(() => {
      if (this.pendingRedraw && !this.isTyping()) this.draw();
    }, 0));
    if (!this.canEdit()) return;

    // Dispatch rows
    const rowOf = el => {
      const row = el.closest('[data-w]');
      return { id: row.dataset.w, i: Number(row.dataset.r) };
    };
    const setRow = (id, i, fields) => this.save(day => {
      const w = ensureWorker(day, id);
      while (w.rows.length <= i) w.rows.push(emptyRow());
      Object.assign(w.rows[i], fields, { savedAt: new Date().toISOString() });
    });

    root.querySelectorAll('.dsp-coord [data-f="attendance"]').forEach(el => el.addEventListener('change', () => {
      const { id } = rowOf(el);
      this.save(day => { ensureWorker(day, id).attendance = el.value; });
    }));

    root.querySelectorAll('.dsp-coord [data-f="project"]').forEach(el => el.addEventListener('change', () => {
      const { id, i } = rowOf(el);
      const pid = el.value;
      const name = pid === WORKSHOP ? WORKSHOP_LABEL : (app.projects.find(p => p.id === pid)?.name || '');
      // Changing the project clears the task; the workshop only takes hand-written work.
      delete this.taskDrafts[`${id}|${i}`];
      const proj = app.projects.find(p => p.id === pid);
      const room = proj ? (this.lastRoom[pid] && roomsOf(proj).includes(this.lastRoom[pid]) ? this.lastRoom[pid] : roomsOf(proj)[0]) : '';
      setRow(id, i, { projectId: pid, project: name, room, kind: pid === WORKSHOP ? 'free' : '', taskId: '', task: '', joint: false });
    }));

    root.querySelectorAll('.dsp-coord [data-f="free"]').forEach(el => el.addEventListener('change', () => {
      const { id, i } = rowOf(el);
      setRow(id, i, { kind: 'free', taskId: '', task: el.value.trim(), joint: false });
    }));

    root.querySelectorAll('.dsp-coord [data-f="room"]').forEach(el => el.addEventListener('change', () => {
      const { id, i } = rowOf(el);
      const row = this.day.workers[id]?.rows?.[i] || emptyRow();
      if (el.value === '__other') {
        this.newRoomFor = `${id}|${i}`;
        this.draw();
        this.container.querySelector(`.dsp-coord [data-w="${id}"][data-r="${i}"] [data-f="roomnew"]`)?.focus();
        return;
      }
      this.lastRoom[row.projectId] = el.value;
      // A task belongs to one room: picking another room clears the task on this row.
      const linked = row.taskId ? app.taskById.get(row.taskId)?.task : null;
      const clear = linked && norm(taskRoom(linked.title)) !== norm(el.value);
      setRow(id, i, clear ? { room: el.value, kind: '', taskId: '', task: '', joint: false } : { room: el.value });
      this.focusTask(id, i);
    }));

    root.querySelectorAll('.dsp-coord [data-f="roomnew"]').forEach(el => {
      let handled = false;
      const done = () => {
        if (handled || !el.isConnected) return;
        handled = true;
        const { id, i } = rowOf(el);
        const pid = this.day.workers[id]?.rows?.[i]?.projectId;
        const name = el.value.trim();
        this.newRoomFor = null;
        if (!name || !pid) { this.draw(); return; }
        this.extraRooms[pid] = [...new Set([...(this.extraRooms[pid] || []), name])];
        this.lastRoom[pid] = name;
        setRow(id, i, { room: name, kind: '', taskId: '', task: '', joint: false });
        this.focusTask(id, i);
      };
      el.addEventListener('change', done);
      el.addEventListener('blur', done);
      el.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); done(); }
        if (e.key === 'Escape') { el.value = ''; done(); }
      });
    });

    // Give the typed task: pick the existing one in that room, or create it.
    const commitTask = (el, allowCreate) => {
      const { id, i } = rowOf(el);
      const key = `${id}|${i}`;
      const row = this.day.workers[id]?.rows?.[i] || emptyRow();
      const project = app.projects.find(p => p.id === row.projectId);
      const input = el.closest('.dsp-row')?.querySelector('[data-f="taskq"]');
      const text = (input ? input.value : '').trim();
      // Leave the text box so the row redraws at once (redraws wait while typing).
      if (allowCreate && input) { input.dataset.entered = '1'; input.blur(); }
      if (!project) return;
      if (!text) { delete this.taskDrafts[key]; setRow(id, i, { kind: '', taskId: '', task: '', joint: false }); return; }
      const roomSel = el.closest('.dsp-row')?.querySelector('[data-f="room"]');
      const room = roomSel && roomSel.value !== '__other' ? roomSel.value : (row.room || roomsOf(project)[0]);
      const open = (project.subtasks || []).filter(t => t.status !== 'completed');
      const inRoom = open.filter(t => norm(taskRoom(t.title)) === norm(room));
      const match = inRoom.find(t => norm(parseTaskTitle(t.title).name) === norm(text));
      const linked = row.taskId ? app.taskById.get(row.taskId)?.task : null;
      if (linked && norm(parseTaskTitle(linked.title).name) === norm(text)) { delete this.taskDrafts[key]; this.draw(); return; }
      if (match) { delete this.taskDrafts[key]; this.assignTaskToRow(app, id, i, match.id); return; }
      if (!allowCreate) {
        // Typed a new name and left the box: keep it, the "Tạo" button creates it.
        this.taskDrafts[key] = text;
        this.draw();
        return;
      }
      try {
        const task = TaskOps.createTask(project.id, room, 'Cả phòng', text, id, this.user);
        delete this.taskDrafts[key];
        this.lastRoom[project.id] = room;
        Toast.success(`Đã tạo "${text}" (${room}) và giao cho ${shortName(app.usersById.get(id)?.name)}.`);
        setRow(id, i, { room, kind: 'task', taskId: task.id, task: taskLabel(task.title), joint: false });
      } catch (err) {
        Toast.error(err.message);
      }
    };

    root.querySelectorAll('.dsp-coord [data-f="taskq"]').forEach(el => {
      // Enter = give/create right away. Leaving the box keeps the text (no auto-create).
      el.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); el.dataset.entered = '1'; commitTask(el, true); } });
      el.addEventListener('change', () => { if (el.dataset.entered) return; commitTask(el, false); });
    });

    root.querySelectorAll('[data-create-task]').forEach(btn => {
      // mousedown keeps the text box's own "change" from redrawing first.
      btn.addEventListener('mousedown', e => e.preventDefault());
      btn.addEventListener('click', () => commitTask(btn, true));
    });

    root.querySelectorAll('[data-delrow]').forEach(btn => btn.addEventListener('click', () => {
      const { id, i } = rowOf(btn);
      Object.keys(this.taskDrafts).forEach(k => { if (k.startsWith(`${id}|`)) delete this.taskDrafts[k]; });
      this.save(day => {
        const w = ensureWorker(day, id);
        if (w.rows.length > 1) w.rows.splice(i, 1);
        else w.rows[0] = emptyRow();
      });
    }));

    root.querySelectorAll('[data-addrow]').forEach(btn => btn.addEventListener('click', () => {
      const id = btn.dataset.addrow;
      this.save(day => { ensureWorker(day, id).rows.push(emptyRow()); });
    }));

    // Report rows
    root.querySelectorAll('.dsp-report [data-rf]').forEach(el => el.addEventListener('change', () => {
      const key = el.closest('[data-key]').dataset.key;
      const f = el.dataset.rf;
      const value = el.value.trim();
      const view = rows.find(r => r.key === key);
      this.save(day => {
        let r = day.report.rows.find(x => x.key === key);
        if (!r) {
          // First edit of an auto row: keep its other draft values as they were shown.
          r = { key, projectId: view?.projectId || '', project: view?.project || '' };
          ['result', 'rating', 'reason'].forEach(k => { if (view?.draft?.[k]) r[k] = view.draft[k]; });
          day.report.rows.push(r);
        }
        r[f] = value;
        if (f === 'project') {
          const p = app.projectByName.get(norm(value));
          r.projectId = p ? p.id : '';
        }
        r.updatedAt = new Date().toISOString();
      });
    }));

    root.querySelectorAll('[data-hide]').forEach(btn => btn.addEventListener('click', async () => {
      const key = btn.dataset.hide;
      const view = rows.find(r => r.key === key);
      if (!await this.ask(view?.line ? `Bỏ báo cáo của ${view.line.who} (${view.project}) khỏi báo cáo ngày này?` : `Bỏ "${view?.project || 'công trình'}" khỏi báo cáo ngày này?`, 'Bỏ khỏi báo cáo')) return;
      this.save(day => {
        const r = day.report.rows.find(x => x.key === key);
        // Hand-added rows are deleted; rows that come from dispatch/reports are hidden for this day.
        if (r && key.startsWith('extra-')) day.report.rows = day.report.rows.filter(x => x.key !== key);
        else if (r) r.hidden = true;
        else day.report.rows.push({ key, project: view?.project || '', projectId: view?.projectId || '', hidden: true });
      });
    }));

    const addBtn = root.querySelector('[data-act="add-row"]');
    if (addBtn) addBtn.addEventListener('click', () => {
      // The key is made once: save() applies the change twice (on screen, then on the server copy).
      const key = `extra-${Date.now().toString(36)}`;
      const stamp = new Date().toISOString();
      this.save(day => { if (!day.report.rows.some(r => r.key === key)) day.report.rows.push({ key, project: '', projectId: '', updatedAt: stamp }); })
        .then(() => {
          const inputs = this.container.querySelectorAll('.dsp-report [data-rf="project"]');
          if (inputs.length) inputs[inputs.length - 1].focus();
        });
    });

    const note = root.querySelector('[data-act="note"]');
    if (note) note.addEventListener('change', () => this.save(day => { day.report.note = note.value.trim(); }));

    const status = root.querySelector('[data-act="status"]');
    status.addEventListener('change', async () => {
      // Leave any text box first so the report redraws as soon as the status is saved.
      if (this.isTyping()) document.activeElement.blur();
      const toSent = status.value === 'Đã gửi';
      if (toSent && !await this.ask('Xác nhận đã gửi báo cáo cuối ngày? Các ô tự điền sẽ được chốt lại.', 'Đã gửi')) { status.value = 'Chưa gửi'; return; }
      this.save(day => {
        // Rows rebuilt from the newest data (the ones drawn on screen may be older).
        const fresh = toSent ? this.reportRows(readAppData(this.date), { ...day, report: { ...day.report, status: 'Chưa gửi' } }) : [];
        day.report.status = status.value;
        if (toSent) {
          day.report.sentAt = new Date().toISOString();
          day.report.sentBy = this.user.id;
          // Archive exactly what was sent: later worker reports or edits do not change it.
          const val = (view, f) => ((view[f] !== undefined ? view[f] : view.draft[f]) || '').trim();
          day.report.snapshot = {
            at: day.report.sentAt,
            by: this.user.id,
            count: fresh.length,
            note: day.report.note || '',
            rows: fresh.map(view => ({
              key: view.key, projectId: view.projectId || '', project: view.project || '',
              who: view.line?.who || '', time: view.line?.time || '', done: !!view.line?.done, photos: view.line?.photos || 0,
              result: val(view, 'result'), rating: val(view, 'rating'), reason: val(view, 'reason'), action: val(view, 'action')
            }))
          };
        } else {
          delete day.report.snapshot; // reopened for editing; a new snapshot is made on the next send
        }
      });
    });

    root.querySelectorAll('.dsp-assign').forEach(sel => sel.addEventListener('change', () => {
      const item = app.backlog.find(b => b.taskId === sel.dataset.bl);
      const id = sel.value;
      sel.value = '';
      if (!item || !id) return;
      if (this.effectiveAttendance(app, id).value === 'Nghỉ') {
        Toast.error(`${shortName(app.usersById.get(id)?.name)} đang nghỉ ngày này.`);
        return;
      }
      this.assignTaskToRow(app, id, null, item.taskId);
    }));

    root.querySelector('[data-act="copy-text"]').addEventListener('click', () => this.openReportText(readAppData(this.date)));
  },

  // Archive of end-of-day reports, one month at a time (one small read).
  async openHistory(month = this.date.slice(0, 7)) {
    const modal = Modal.create('Lịch sử báo cáo cuối ngày', `
      <div class="dsp-hist">
        <label class="dsp-hist-month">Tháng <input type="month" class="dsp-in" value="${esc(month)}"></label>
        <div class="dsp-hist-list"><p class="dsp-muted"><i class="fas fa-spinner fa-spin"></i> Đang tải…</p></div>
      </div>`);
    const list = modal.element.querySelector('.dsp-hist-list');
    const users = new Map((DB.load().users || []).map(u => [u.id, u]));
    const weekday = iso => new Intl.DateTimeFormat('vi-VN', { weekday: 'short', timeZone: 'UTC' }).format(new Date(`${iso}T12:00:00Z`));
    const show = async m => {
      list.innerHTML = '<p class="dsp-muted"><i class="fas fa-spinner fa-spin"></i> Đang tải…</p>';
      let days;
      try { days = await DispatchStore.listMonth(m); } catch (e) { list.innerHTML = '<p class="dsp-late">Không tải được lịch sử. Vui lòng thử lại.</p>'; return; }
      if (!days.length) { list.innerHTML = '<p class="dsp-muted">Tháng này chưa có báo cáo nào.</p>'; return; }
      list.innerHTML = days.map(d => {
        const sentOk = d.status === 'Đã gửi';
        const by = d.sentBy ? shortName(users.get(d.sentBy)?.name) : '';
        return `<button type="button" class="dsp-hist-item ${sentOk ? 'is-sent' : ''}" data-date="${esc(d.date)}">
          <span class="dsp-hist-date"><b>${esc(dayText(d.date).slice(0, 5))}</b><small>${esc(weekday(d.date))}</small></span>
          <span class="dsp-hist-info">${sentOk
            ? `<b class="dsp-ok">✓ Đã gửi</b> ${esc(stampText(d.sentAt))}${by ? ` · ${esc(by)}` : ''}<small>${d.rows} dòng báo cáo${d.note ? ' · có ghi chú' : ''}</small>`
            : `<b class="dsp-left">Chưa gửi</b><small>Có điều phối nhưng chưa chốt báo cáo</small>`}</span>
          <span class="dsp-hist-go">Xem <i class="fas fa-chevron-right"></i></span>
        </button>`;
      }).join('');
      list.querySelectorAll('[data-date]').forEach(btn => btn.addEventListener('click', async () => {
        modal.close();
        this.date = btn.dataset.date;
        await this.reload();
        this.container.querySelector('.dsp-report')?.scrollIntoView({ block: 'start', behavior: 'smooth' });
      }));
    };
    modal.element.querySelector('input[type="month"]').addEventListener('change', e => { if (e.target.value) show(e.target.value); });
    show(month);
  },

  focusTask(id, i) {
    setTimeout(() => this.container?.querySelector(`.dsp-coord [data-w="${id}"][data-r="${i}"] [data-f="taskq"]`)?.focus(), 0);
  },

  // Yes/no question in the app's own dialog (native confirm() can be blocked or
  // auto-dismissed in some browsers, which silently discarded the user's input).
  ask(message, okLabel = 'Đồng ý') {
    return new Promise(resolve => {
      let answered = false;
      const modal = Modal.create('Xác nhận', `<div class="dsp-choice"><p>${esc(message)}</p>
        <div class="dsp-ask-actions"><button type="button" class="dsp-btn" data-ans="no">Huỷ</button><button type="button" class="dsp-btn dsp-btn-primary" data-ans="yes">${esc(okLabel)}</button></div></div>`);
      const finish = value => { if (answered) return; answered = true; resolve(value); };
      modal.element.querySelectorAll('[data-ans]').forEach(b => b.addEventListener('click', () => { finish(b.dataset.ans === 'yes'); modal.close(); }));
      // Closed with ✕ or by tapping outside = no.
      new MutationObserver((_, obs) => { if (!modal.element.isConnected) { obs.disconnect(); finish(false); } }).observe(document.body, { childList: true });
    });
  },

  // Put an existing task (from Tiến Độ) on a worker's day. rowIndex null = first free row.
  // Never copies the task: a task has one owner; dispatch only says who works on it today.
  assignTaskToRow(app, workerId, rowIndex, taskId) {
    const info = app.taskById.get(taskId);
    const worker = app.usersById.get(workerId);
    if (!info || !worker) { Toast.error('Không tìm thấy nhiệm vụ.'); this.draw(); return; }
    const { task, project } = info;
    const dup = (this.day.workers[workerId]?.rows || []).some((r, j) => r.taskId === taskId && j !== rowIndex);
    if (dup) { Toast.info(`${shortName(worker.name)} đã có nhiệm vụ này trong ngày.`); this.draw(); return; }
    const apply = joint => this.save(day => {
      const fields = { projectId: project.id, project: project.name, room: taskRoom(task.title), kind: 'task', taskId, task: taskLabel(task.title), joint };
      if (rowIndex === null) { placeInRow(day, workerId, fields); return; }
      const w = ensureWorker(day, workerId);
      while (w.rows.length <= rowIndex) w.rows.push(emptyRow());
      Object.assign(w.rows[rowIndex], fields, { savedAt: new Date().toISOString() });
    });

    if (!task.assignedTo) {
      TaskOps.assignTask(project.id, taskId, workerId, this.user, 'Giao');
      Toast.success(`Đã giao "${parseTaskTitle(task.title).name}" cho ${shortName(worker.name)} (cập nhật cả tab Tiến Độ).`);
      apply(false);
      return;
    }
    if (task.assignedTo === workerId) { apply(false); return; }

    // Someone else owns it: work together today, or hand it over for good.
    const owner = app.usersById.get(task.assignedTo);
    const ownerName = shortName(owner?.name || 'người khác');
    this.draw(); // reset the dropdown until a choice is made
    const modal = Modal.create('Nhiệm vụ đang có người phụ trách', `
      <div class="dsp-choice">
        <p><b>${esc(taskLabel(task.title))}</b><br><span class="dsp-muted">${esc(project.name)} · đang do <b>${esc(ownerName)}</b> phụ trách</span></p>
        <button type="button" class="dsp-choice-btn" data-choice="joint"><b>Làm cùng hôm nay</b><span>${esc(ownerName)} vẫn phụ trách. ${esc(shortName(worker.name))} được báo cáo nhiệm vụ này trong ngày.</span></button>
        <button type="button" class="dsp-choice-btn" data-choice="move"><b>Chuyển hẳn cho ${esc(shortName(worker.name))}</b><span>Đổi người phụ trách ở tab Tiến Độ và ghi vào lịch sử công trình.</span></button>
        <button type="button" class="dsp-btn" data-choice="cancel">Huỷ</button>
      </div>`);
    modal.element.querySelectorAll('[data-choice]').forEach(btn => btn.addEventListener('click', () => {
      const choice = btn.dataset.choice;
      modal.close();
      if (choice === 'joint') apply(true);
      if (choice === 'move') {
        TaskOps.assignTask(project.id, taskId, workerId, this.user, 'Chuyển');
        Toast.success(`Đã chuyển nhiệm vụ cho ${shortName(worker.name)}.`);
        apply(false);
      }
    }));
  },

  // Plain-text report for the Zalo group: short lines, one status icon per job,
  // grouped by project, with a headcount and a summary at the top.
  buildReportText(rows, app) {
    const date = this.date;
    const weekday = new Intl.DateTimeFormat('vi-VN', { weekday: 'long', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`));
    const cap = t => t.charAt(0).toLocaleUpperCase('vi-VN') + t.slice(1);
    const sent = this.day.report.status === 'Đã gửi' && this.day.report.snapshot;
    const authorId = sent ? this.day.report.snapshot.by : this.user?.id;
    const author = shortName(app.usersById.get(authorId)?.name || this.user?.name);
    const val = (r, f) => String((r[f] !== undefined ? r[f] : r.draft?.[f]) || '').trim().replace(/\s*\n\s*/g, '; ');
    const LINE = '━━━━━━━━━━━━━━';

    // Status of one job line.
    const iconOf = r => {
      const rating = val(r, 'rating');
      if (rating === 'Chậm tiến độ') return '⚠️';
      if (rating === 'Thay đổi kế hoạch') return '🔁';
      if (r.line?.done || rating === 'Đúng tiến độ' || rating === 'Vượt tiến độ') return '✅';
      return '🔄';
    };

    // Headcount from today's dispatch.
    const att = app.crew.map(u => ({ u, a: this.effectiveAttendance(app, u.id).value }));
    const names = v => att.filter(x => x.a === v).map(x => shortName(x.u.name));
    const working = names('Có làm');
    const off = [...names('Nghỉ'), ...names('Tạm vắng').map(n => `${n} (tạm vắng)`)];
    const unknown = names('Chưa xác nhận');

    const counts = { done: 0, doing: 0, late: 0, change: 0 };
    rows.forEach(r => {
      const i = iconOf(r);
      if (i === '✅') counts.done++; else if (i === '⚠️') counts.late++; else if (i === '🔁') counts.change++; else counts.doing++;
    });

    const out = [];
    out.push(`📋 BÁO CÁO CUỐI NGÀY`);
    out.push(`🗓 ${cap(weekday)}, ${dayText(date)}`);
    out.push(`✍️ Tổng hợp: ${author}`);
    out.push('');
    out.push(`👷 Nhân sự: ${working.length}/${app.crew.length} đi làm${working.length ? ` (${working.join(', ')})` : ''}`);
    if (off.length) out.push(`   Nghỉ: ${off.join(', ')}`);
    if (unknown.length) out.push(`   Chưa xác nhận: ${unknown.join(', ')}`);
    if (rows.length) {
      const parts = [`✅ ${counts.done} xong`, `🔄 ${counts.doing} đang làm`];
      if (counts.late) parts.push(`⚠️ ${counts.late} chậm`);
      if (counts.change) parts.push(`🔁 ${counts.change} đổi kế hoạch`);
      out.push(`📊 ${rows.length} đầu việc: ${parts.join(' · ')}`);
    }

    // Jobs grouped by project, in report order.
    const byProject = new Map();
    rows.forEach(r => {
      const k = r.project || 'Công trình khác';
      if (!byProject.has(k)) byProject.set(k, []);
      byProject.get(k).push(r);
    });
    if (!rows.length) out.push('', 'Hôm nay chưa có báo cáo công việc.');
    [...byProject].forEach(([project, list], n) => {
      out.push('', LINE, `🏠 ${n + 1}. ${project.toLocaleUpperCase('vi-VN')}`, LINE);
      list.forEach(r => {
        const who = r.line?.who ? `${r.line.who} — ` : '';
        out.push(`${iconOf(r)} ${who}${val(r, 'result') || 'Chưa ghi nội dung'}`);
        const rating = val(r, 'rating');
        if (rating === 'Chậm tiến độ' || rating === 'Thay đổi kế hoạch' || rating === 'Vượt tiến độ') out.push(`   • Đánh giá: ${rating}`);
        const reason = val(r, 'reason');
        if (reason) {
          const left = reason.match(/^còn\s*:\s*(.*)$/i);
          out.push(left ? `   • Còn lại: ${left[1]}` : `   • Lý do: ${reason}`);
        }
        const action = val(r, 'action');
        if (action) out.push(`   • Hướng xử lý: ${action}`);
      });
    });

    const note = (sent ? this.day.report.snapshot.note : this.day.report.note || '').trim();
    if (note) out.push('', '📝 GHI CHÚ / ĐỀ XUẤT', ...note.split(/\n+/).map(x => `• ${x.trim()}`));

    // Plan for the next day, when it has been prepared.
    const next = this.nextDay;
    if (next && next.date === shiftDate(date, 1)) {
      const plan = app.crew.map(u => {
        const w = next.workers[u.id];
        if (!w) return null;
        if (w.attendance === 'Nghỉ') return `• ${shortName(u.name)}: nghỉ`;
        const jobs = w.rows.filter(rowHasWork).map(r => {
          const t = r.taskId ? app.taskById.get(r.taskId)?.task : null;
          const job = t ? parseTaskTitle(t.title).name : (r.task || '');
          return `${r.project || ''}${job ? ` – ${job}` : ''}`;
        }).filter(Boolean);
        return jobs.length ? `• ${shortName(u.name)}: ${jobs.join('; ')}` : null;
      }).filter(Boolean);
      if (plan.length) out.push('', `📅 KẾ HOẠCH ${dayText(next.date).slice(0, 5)}`, ...plan);
    }
    return out.join('\n');
  },

  // Preview, then copy or share (Zalo on phones via the system share sheet).
  openReportText(app) {
    const rows = this.reportRows(app);
    const text = this.buildReportText(rows, app);
    const canShare = typeof navigator.share === 'function';
    const modal = Modal.create('Báo cáo gửi nhóm Zalo', `
      <div class="dsp-share">
        <p class="dsp-muted">Xem lại nội dung. Có thể sửa trực tiếp trước khi sao chép.</p>
        <textarea class="dsp-in dsp-share-text" rows="16" spellcheck="false">${esc(text)}</textarea>
        <div class="dsp-ask-actions">
          ${canShare ? '<button type="button" class="dsp-btn" data-share><i class="fas fa-share-nodes"></i> Chia sẻ…</button>' : ''}
          <button type="button" class="dsp-btn dsp-btn-primary" data-copy><i class="fas fa-copy"></i> Sao chép</button>
        </div>
      </div>`);
    const box = modal.element.querySelector('.dsp-share-text');
    const done = () => { Toast.success('Đã sao chép. Mở nhóm Zalo và dán để gửi.'); modal.close(); };
    modal.element.querySelector('[data-copy]').addEventListener('click', () => {
      const value = box.value;
      if (navigator.clipboard?.writeText) navigator.clipboard.writeText(value).then(done).catch(() => this.fallbackCopy(value, done));
      else this.fallbackCopy(value, done);
    });
    modal.element.querySelector('[data-share]')?.addEventListener('click', () => {
      navigator.share({ text: box.value }).then(() => modal.close()).catch(() => { /* cancelled */ });
    });
  },

  fallbackCopy(text, done) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); done(); } catch { Toast.error('Không sao chép được.'); }
    ta.remove();
  }
};
