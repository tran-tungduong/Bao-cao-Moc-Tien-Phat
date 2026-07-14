// FurniReport Mock Database Client with LocalStorage Persistence
const DB_KEY = 'furni_report_db';

// SUPABASE CONFIGURATION
// Sếp hãy điền thông tin dự án Supabase của mình ở đây để chạy đám mây:
const SUPABASE_URL = 'https://qadsqfhvrhdmpjpexews.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_oRsfH9QxhIk8yGeDN_gApw_8LZNO5zX';

// Initialize Supabase Client dynamically if configured
let supabaseClient = null;
if (typeof supabase !== 'undefined' && SUPABASE_URL && SUPABASE_URL !== 'YOUR_SUPABASE_URL') {
  try {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('Supabase client successfully initialized.');
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
  }
}

const DEFAULT_USERS = [
  { id: 'usr_luan', username: 'admin', password: '123', name: 'Tôn Thất Uyên Luận (Sếp)', role: 'manager', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=60' },
  { id: 'usr_hai', username: 'hai.ta', password: '123', name: 'Tạ Quốc Hải (Sale)', role: 'sales', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&auto=format&fit=crop&q=60' },
  { id: 'usr_long', username: 'long.tran', password: '123', name: 'Trần Hữu Nhật Long (3D/Kỹ thuật)', role: 'kts', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60' },
  { id: 'usr_duong', username: 'duong.tran', password: '123', name: 'Trần Tùng Dương (Marketing)', role: 'marketing', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=60' },
  { id: 'usr_cuong', username: 'cuong.tran', password: '123', name: 'Trần Nhật Cường (Thợ chính)', role: 'lead_worker', avatar: 'https://images.unsplash.com/photo-1489980508314-941910ded1f4?w=100&auto=format&fit=crop&q=60' },
  { id: 'usr_ut', username: 'ut.ut', password: '123', name: 'Út Út (Thợ chính)', role: 'lead_worker', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&auto=format&fit=crop&q=60' },
  { id: 'usr_minhnhat', username: 'minh.nhat', password: '123', name: 'Minh Nhật (Thợ phụ)', role: 'assistant_worker', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60' },
  { id: 'usr_bom', username: 'bom', password: '123', name: 'Bom (Thợ phụ)', role: 'assistant_worker', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=60' }
];

const DEFAULT_PROJECTS = [];

const DEFAULT_ATTENDANCE = [];

export const DB = {
  // Server Sync API Base URL (same host/origin for simplicity, fallback to localhost:8000 for local file testing)
  getApiUrl(endpoint) {
    const origin = window.location.origin;
    const base = (origin.startsWith('http://') || origin.startsWith('https://')) ? origin : 'http://localhost:8000';
    return `${base}${endpoint}`;
  },

  // Triggered in app.js on startup and periodically (polling)
  async syncWithServer(onSyncComplete = null) {
    // 1. SUPABASE MODE
    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('app_state')
          .select('data')
          .eq('id', 1)
          .single();

        if (error && error.code !== 'PGRST116') { // Ignore single-row empty result error code
          console.warn('Supabase fetch error, fallback to local database.', error);
          return false;
        }

        let serverDb = data ? data.data : null;
        
        // Self-seed if serverDb is empty or has no users
        if (!serverDb || !serverDb.users || serverDb.users.length === 0) {
          serverDb = {
            users: DEFAULT_USERS,
            projects: DEFAULT_PROJECTS,
            attendance: DEFAULT_ATTENDANCE,
            systemLogs: []
          };

          const { data: checkData } = await supabaseClient.from('app_state').select('id').eq('id', 1);
          if (checkData && checkData.length > 0) {
            await supabaseClient
              .from('app_state')
              .update({ data: serverDb, updated_at: new Date().toISOString() })
              .eq('id', 1);
          } else {
            await supabaseClient
              .from('app_state')
              .insert({ id: 1, data: serverDb, updated_at: new Date().toISOString() });
          }
          console.log('Seeded default database to Supabase.');
        }

        const localData = localStorage.getItem(DB_KEY);
        if (localData) {
          const localDb = JSON.parse(localData);

          // Auto-recovery: If Supabase DB is empty/no projects, but local cache has projects, push local to Supabase!
          if (localDb && localDb.projects && localDb.projects.length > 0 && (!serverDb.projects || serverDb.projects.length === 0)) {
            console.warn('Supabase projects are empty, but local has projects. Recovering to Supabase...');
            try {
              await supabaseClient
                .from('app_state')
                .update({ data: localDb, updated_at: new Date().toISOString() })
                .eq('id', 1);
              serverDb = localDb;
            } catch (recoveryErr) {
              console.error('Failed to auto-recover database to Supabase:', recoveryErr);
            }
          }

          if (JSON.stringify(localDb) !== JSON.stringify(serverDb)) {
            localStorage.setItem(DB_KEY, JSON.stringify(serverDb));
            console.log('Database synced from Supabase.');
            if (onSyncComplete) onSyncComplete(serverDb);
          }
        } else {
          localStorage.setItem(DB_KEY, JSON.stringify(serverDb));
          if (onSyncComplete) onSyncComplete(serverDb);
        }
        return true;
      } catch (e) {
        console.error('Error syncing from Supabase:', e);
      }
      return false;
    }

    // 2. LOCAL PYTHON SERVER MODE (FALLBACK)
    try {
      const res = await fetch(this.getApiUrl('/api/db'));
      if (res.ok) {
        const serverDb = await res.json();
        if (serverDb && serverDb.users) {
          const localData = localStorage.getItem(DB_KEY);
          if (localData) {
            const localDb = JSON.parse(localData);
            if (JSON.stringify(localDb) !== JSON.stringify(serverDb)) {
              localStorage.setItem(DB_KEY, JSON.stringify(serverDb));
              console.log('Database synced from server.');
              if (onSyncComplete) onSyncComplete(serverDb);
            }
          } else {
            localStorage.setItem(DB_KEY, JSON.stringify(serverDb));
            if (onSyncComplete) onSyncComplete(serverDb);
          }
          return true;
        }
      }
    } catch (e) {
      console.warn('API Server is offline or unreachable. Using offline LocalStorage mode.', e);
    }
    return false;
  },

  // Push changes to server in background (non-blocking)
  pushToServer(db) {
    // 1. SUPABASE MODE
    if (supabaseClient) {
      supabaseClient
        .from('app_state')
        .update({ data: db, updated_at: new Date().toISOString() })
        .eq('id', 1)
        .then(({ error }) => {
          if (error) {
            console.error('Failed to save to Supabase server:', error);
          } else {
            console.log('Database changes successfully saved to Supabase.');
          }
        })
        .catch(err => {
          console.error('Network error saving to Supabase:', err);
        });
      return;
    }

    // 2. LOCAL PYTHON SERVER MODE (FALLBACK)
    fetch(this.getApiUrl('/api/db/save'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(db)
    }).then(res => {
      if (!res.ok) {
        console.error('Failed to save to remote database server.');
      } else {
        console.log('Database changes successfully saved to server.');
      }
    }).catch(err => {
      console.warn('Unable to push changes to server (offline). Will sync when connection is restored.', err);
    });
  },

  // Remote reset database trigger
  async resetServerDb() {
    const seedDb = {
      users: DEFAULT_USERS,
      projects: DEFAULT_PROJECTS,
      attendance: DEFAULT_ATTENDANCE,
      systemLogs: []
    };

    if (supabaseClient) {
      try {
        const { error } = await supabaseClient
          .from('app_state')
          .update({ data: seedDb, updated_at: new Date().toISOString() })
          .eq('id', 1);

        if (!error) {
          localStorage.setItem(DB_KEY, JSON.stringify(seedDb));
          localStorage.removeItem('furni_session');
          return true;
        }
      } catch (e) {
        console.error('Failed to reset database on Supabase.', e);
      }
      return false;
    }

    try {
      const res = await fetch(this.getApiUrl('/api/db/reset'), { method: 'POST' });
      if (res.ok) {
        const result = await res.json();
        if (result.status === 'success') {
          localStorage.setItem(DB_KEY, JSON.stringify(result.db));
          localStorage.removeItem('furni_session');
          return true;
        }
      }
    } catch (e) {
      console.error('Failed to reset remote database server.', e);
    }
    return false;
  },

  // Load database from localStorage
  load() {
    // Check reset parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('reset') === '1') {
      localStorage.removeItem(DB_KEY);
      localStorage.removeItem('furni_session');
      this.resetServerDb(); // Also reset the server in background!
      // Clean query parameter from address bar
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    let data = localStorage.getItem(DB_KEY);
    let db = null;
    if (data) {
      db = JSON.parse(data);
    }
    // Overwrite database if it doesn't contain the new user usr_luan or attendance list
    if (!db || !db.users || !db.users.find(u => u.id === 'usr_luan') || !db.attendance) {
      db = {
        users: DEFAULT_USERS,
        projects: DEFAULT_PROJECTS,
        attendance: DEFAULT_ATTENDANCE,
        systemLogs: []
      };
      localStorage.setItem(DB_KEY, JSON.stringify(db));
      localStorage.removeItem('furni_session'); // Clear session
      return db;
    }
    
    // Auto-update: Ensure the 2 new assistant workers exist in db.users
    const targetAssistants = [
      { id: 'usr_minhnhat', username: 'minh.nhat', password: '123', name: 'Minh Nhật (Thợ phụ)', role: 'assistant_worker', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60' },
      { id: 'usr_bom', username: 'bom', password: '123', name: 'Bom (Thợ phụ)', role: 'assistant_worker', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=60' }
    ];
    let dbChanged = false;
    targetAssistants.forEach(a => {
      if (!db.users.some(u => u.id === a.id)) {
        db.users.push(a);
        dbChanged = true;
      }
    });

    // Auto-update: Ensure assignees exists on all projects
    let assigneesChanged = false;
    if (db.projects) {
      db.projects.forEach(p => {
        if (!p.assignees) {
          const uniqueAssignees = [...new Set(p.subtasks.map(st => st.assignedTo).filter(id => id))];
          p.assignees = uniqueAssignees;
          assigneesChanged = true;
        }
      });
    }

    // Auto-update: Migrate project.step from 9-step system to 4-phase system
    let stepsMigrated = false;
    if (db.projects) {
      db.projects.forEach(p => {
        if (!p._migratedToPhases) {
          const oldStep = p.step || 1;
          let newStep = 1;
          if (oldStep <= 2) {
            newStep = 1; // Thiết Kế
          } else if (oldStep <= 5) {
            newStep = 2; // Gia Công Tại Xưởng
          } else if (oldStep <= 8) {
            newStep = 3; // Lắp Ráp Tại Công Trình
          } else {
            newStep = 4; // Đã Bàn Giao
          }
          p.step = newStep;
          p.isFrozen = false; // Unfreeze all projects during migration
          p._migratedToPhases = true;
          stepsMigrated = true;
        }
      });
    }

    if (dbChanged || assigneesChanged || stepsMigrated) {
      localStorage.setItem(DB_KEY, JSON.stringify(db));
      this.pushToServer(db);
    }
    
    return db;
  },

  // Save database to localStorage
  save(data) {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
    this.pushToServer(data);
  },

  // Get current user session
  getCurrentUser() {
    const session = localStorage.getItem('furni_session');
    return session ? JSON.parse(session) : null;
  },

  // Login
  login(username, password) {
    const db = this.load();
    const user = db.users.find(u => u.username === username.trim() && u.password === password.trim());
    if (user) {
      localStorage.setItem('furni_session', JSON.stringify(user));
      return user;
    }
    return null;
  },

  // Logout
  logout() {
    localStorage.removeItem('furni_session');
  },

  // Get all projects
  getProjects() {
    const db = this.load();
    return db.projects;
  },

  // Get projects for a specific user role and assigned tasks
  getProjectsForUser(user) {
    if (!user) return [];
    const db = this.load();
    const projects = db.projects;

    // Managers see all projects (active and completed)
    if (user.role === 'manager') {
      return projects;
    }

    // Other roles only see active (non-completed) projects that are relevant to them
    const activeProjects = projects.filter(p => !p.isCompleted);

    if (user.role === 'kts' || user.role === 'sales') {
      return activeProjects;
    }

    if (user.role === 'marketing') {
      return activeProjects.filter(p => p.step <= 4 || (p.assignees && p.assignees.includes(user.id)));
    } else if (user.role === 'assistant_worker') {
      const selectedLeadId = this.getSelectedLeadWorkerForAssistant(user.id);
      if (!selectedLeadId) return [];
      
      const leadUser = db.users.find(u => u.id === selectedLeadId);
      if (!leadUser) return [];
      
      return this.getProjectsForUser(leadUser);
    } else if (user.role === 'lead_worker') {
      // Get today's working project assignment via attendance
      const today = new Date().toISOString().split('T')[0];
      const todayRecord = db.attendance ? db.attendance.find(a => a.userId === user.id && a.date === today) : null;
      const todayProjectId = todayRecord && todayRecord.status === 'present' ? todayRecord.workingProjectId : '';

      return activeProjects.filter(p => {
        const isProjectAssignee = p.assignees && p.assignees.includes(user.id);
        const hasAssignedSubtask = p.subtasks && p.subtasks.some(st => st.assignedTo === user.id);
        const isTodayWorkingProject = p.id === todayProjectId;
        return isProjectAssignee || hasAssignedSubtask || isTodayWorkingProject;
      });
    }

    return activeProjects;
  },

  // Get single project
  getProject(id) {
    const db = this.load();
    return db.projects.find(p => p.id === id);
  },

  // Move project forward (only forward!)
  advanceProject(projectId, userId) {
    const db = this.load();
    const project = db.projects.find(p => p.id === projectId);
    const user = db.users.find(u => u.id === userId);

    if (project && project.step < 4) {
      if (project.isRework && project.subtasks.some(st => st.type === 'rework' && st.status === 'pending')) {
        throw new Error('Không thể tiến hành khi có NHIỆM VỤ SỬA LỖI chưa hoàn thành.');
      }

      project.step += 1;
      project.history.push({
        timestamp: new Date().toISOString(),
        action: `Chuyển tiến độ sang Giai đoạn ${project.step}`,
        user: user ? user.name : 'Nhân viên'
      });
      this.save(db);
      return project;
    }
    return null;
  },

  // Complete project entirely (Hoàn thành bàn giao)
  completeProject(projectId, userId) {
    const db = this.load();
    const project = db.projects.find(p => p.id === projectId);
    const user = db.users.find(u => u.id === userId);

    if (project) {
      project.isCompleted = true;
      project.completedAt = new Date().toISOString();
      project.history.push({
        timestamp: new Date().toISOString(),
        action: `Hoàn thành công trình toàn bộ, đóng hồ sơ bàn giao`,
        user: user ? user.name : 'Sếp'
      });
      this.save(db);
      return project;
    }
    return null;
  },

  // Rework (Sửa hàng lỗi)
  triggerRework(projectId, taskTitle, assignedWorkerId, userId) {
    const db = this.load();
    const project = db.projects.find(p => p.id === projectId);
    const user = db.users.find(u => u.id === userId);
    const worker = db.users.find(u => u.id === assignedWorkerId);

    if (project) {
      project.isRework = true;
      const subtaskId = 'sub_' + Math.random().toString(36).substr(2, 9);

      project.subtasks.push({
        id: subtaskId,
        title: taskTitle,
        assignedTo: assignedWorkerId,
        status: 'pending',
        type: 'rework'
      });

      project.history.push({
        timestamp: new Date().toISOString(),
        action: `Báo lỗi & Yêu cầu sửa hàng: "${taskTitle}" (Giao cho: ${worker ? worker.name : 'Chưa rõ'})`,
        user: user ? user.name : 'Nhân viên'
      });

      this.save(db);
      return project;
    }
    return null;
  },

  // Resolve subtask (normal or rework or small scope)
  completeSubtask(projectId, subtaskId, userId) {
    const db = this.load();
    const project = db.projects.find(p => p.id === projectId);
    const user = db.users.find(u => u.id === userId);

    if (project) {
      const task = project.subtasks.find(st => st.id === subtaskId);
      if (task) {
        task.status = 'completed';
        task.completedAt = new Date().toISOString();

        project.history.push({
          timestamp: new Date().toISOString(),
          action: `Hoàn thành nhiệm vụ: "${task.title}"`,
          user: user ? user.name : 'Nhân viên'
        });

        // Check if there are any pending rework tasks left
        const hasPendingRework = project.subtasks.some(st => st.type === 'rework' && st.status === 'pending');
        if (!hasPendingRework) {
          project.isRework = false;
        }

        this.save(db);
        return project;
      }
    }
    return null;
  },

  // Delete subtask (Xóa nhiệm vụ)
  deleteSubtask(projectId, subtaskId, userId) {
    const db = this.load();
    const project = db.projects.find(p => p.id === projectId);
    const user = db.users.find(u => u.id === userId);

    if (project) {
      const taskIndex = project.subtasks.findIndex(st => st.id === subtaskId);
      if (taskIndex > -1) {
        const task = project.subtasks[taskIndex];
        project.subtasks.splice(taskIndex, 1);

        // Check if there are any pending rework tasks left
        const hasPendingRework = project.subtasks.some(st => st.type === 'rework' && st.status === 'pending');
        if (!hasPendingRework) {
          project.isRework = false;
        }

        project.history.push({
          timestamp: new Date().toISOString(),
          action: `Xóa nhiệm vụ: "${task.title}"`,
          user: user ? user.name : 'Sếp'
        });

        this.save(db);
        return project;
      }
    }
    return null;
  },

  // Add Small Scope Hạng mục Phát sinh Nhỏ
  addSmallScope(projectId, description, extendDays = 2, assignedWorkerId, userId) {
    const db = this.load();
    const project = db.projects.find(p => p.id === projectId);
    const user = db.users.find(u => u.id === userId);
    const worker = db.users.find(u => u.id === assignedWorkerId);

    if (project) {
      project.isSmallScope = true;

      // Extend deadline
      const dl = new Date(project.deadline);
      dl.setDate(dl.getDate() + parseInt(extendDays));
      project.deadline = dl.toISOString().split('T')[0];

      // Add subtask
      const subtaskId = 'sub_' + Math.random().toString(36).substr(2, 9);
      project.subtasks.push({
        id: subtaskId,
        title: `[PHÁT SINH NHỎ] ${description}`,
        assignedTo: assignedWorkerId,
        status: 'pending',
        type: 'small_scope'
      });

      project.history.push({
        timestamp: new Date().toISOString(),
        action: `Thêm phát sinh nhỏ: "${description}" (+${extendDays} ngày deadline, Giao cho: ${worker ? worker.name : 'Chưa rõ'})`,
        user: user ? user.name : 'Nhân viên'
      });

      this.save(db);
      return project;
    }
    return null;
  },

  // Add Large Scope (Tạo thẻ phát sinh lớn mới từ Bước 1)
  addLargeScope(parentProjectName, categoryName, deadline, userId) {
    const db = this.load();
    const user = db.users.find(u => u.id === userId);

    const parentProject = db.projects.find(p => p.name === parentProjectName);
    const parentAssignees = parentProject ? [...(parentProject.assignees || [])] : [];

    const newProject = {
      id: 'prj_ps_' + Math.random().toString(36).substr(2, 9),
      name: `[PHÁT SINH] - ${parentProjectName} - ${categoryName}`,
      step: 1, // Khảo Sát
      deadline: deadline,
      originalDeadline: deadline,
      isFrozen: false,
      freezeReason: null,
      freezeStartedAt: null,
      totalFreezeTime: 0,
      isRework: false,
      isSmallScope: false,
      subtasks: [],
      dailyLogs: [],
      assignees: parentAssignees,
      history: [
        {
          timestamp: new Date().toISOString(),
          action: `Khởi tạo công trình phát sinh lớn từ dự án gốc: ${parentProjectName}`,
          user: user ? user.name : 'Nhân viên'
        }
      ]
    };

    db.projects.push(newProject);
    this.save(db);
    return newProject;
  },

  // Submit Daily Log (Báo cáo cuối ngày)
  submitDailyLog(projectId, status, note, photos = [], userId, expectedCompletionDate = '', items = [], approverId = '') {
    const db = this.load();
    const project = db.projects.find(p => p.id === projectId);
    const user = db.users.find(u => u.id === userId);

    if (project) {
      if (photos.length < 1) {
        throw new Error('Yêu cầu bắt buộc đính kèm tối thiểu 1 ảnh thực tế.');
      }

      const logId = 'log_' + Math.random().toString(36).substr(2, 9);
      const isAssistant = user && user.role === 'assistant_worker';

      // Check if they are marked as working at workshop today in attendance sheet
      const today = new Date().toISOString().split('T')[0];
      const todayRecord = db.attendance ? db.attendance.find(a => a.userId === userId && a.date === today) : null;
      const isWorkshopToday = todayRecord && (todayRecord.isWorkingAtWorkshop === true || todayRecord.isWorkingAtWorkshop === 'true');

      // Needs approval if: is assistant, project step is 3 (installation at site) AND they are not assigned to work at workshop today
      const needsApproval = isAssistant && project.step === 3 && !isWorkshopToday;

      const newLog = {
        id: logId,
        date: today,
        reporterId: userId,
        reporterName: user ? user.name : 'Thợ thi công',
        reporterRole: user ? user.role : 'worker',
        status: status, // 'on_track' | 'delayed'
        note: note,
        photos: photos,
        expectedCompletionDate: expectedCompletionDate,
        items: items,
        approved: !needsApproval,
        approverId: approverId
      };

      project.dailyLogs.unshift(newLog);

      project.history.push({
        timestamp: new Date().toISOString(),
        action: needsApproval 
          ? `Gửi báo cáo thợ phụ (Chờ thợ chính duyệt): Trạng thái [${status === 'on_track' ? 'Đúng tiến độ' : 'Bị chậm'}], Dự kiến xong: ${expectedCompletionDate || 'Chưa đặt'}`
          : `Gửi báo cáo thợ phụ độc lập tại xưởng: Trạng thái [${status === 'on_track' ? 'Đúng tiến độ' : 'Bị chậm'}], Dự kiến xong: ${expectedCompletionDate || 'Chưa đặt'}`,
        user: user ? user.name : 'Nhân viên'
      });

      this.save(db);
      return newLog;
    }
    return null;
  },

  // Phê duyệt báo cáo thợ phụ bởi thợ chính
  approveDailyLog(projectId, logId, status, note, expectedCompletionDate, items, photos, leadUserId) {
    const db = this.load();
    const project = db.projects.find(p => p.id === projectId);
    const leadUser = db.users.find(u => u.id === leadUserId);

    if (project) {
      const log = project.dailyLogs.find(l => l.id === logId);
      if (log) {
        log.status = status;
        log.note = note;
        log.expectedCompletionDate = expectedCompletionDate;
        log.items = items;
        log.photos = photos;
        log.approved = true;
        log.approvedBy = leadUser ? leadUser.name : 'Thợ chính';
        log.approvedAt = new Date().toISOString();

        project.history.push({
          timestamp: new Date().toISOString(),
          action: `Phê duyệt báo cáo của thợ phụ: Trạng thái [${status === 'on_track' ? 'Đúng tiến độ' : 'Bị chậm'}], Dự kiến xong: ${expectedCompletionDate || 'Chưa đặt'}`,
          user: leadUser ? leadUser.name : 'Thợ chính'
        });

        this.save(db);
        return log;
      }
    }
    return null;
  },

  // Get attendance records for a specific date
  getAttendance(date) {
    const db = this.load();
    if (!db.attendance) db.attendance = [];

    // Temporarily only check attendance for workers (lead_worker and assistant_worker)
    const targetUsers = db.users.filter(u => u.role === 'lead_worker' || u.role === 'assistant_worker');

    return targetUsers.map(user => {
      const record = db.attendance.find(a => a.userId === user.id && a.date === date);
      return {
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        userAvatar: user.avatar,
        date: date,
        time: record ? record.time : '',
        status: record ? record.status : 'no_record', // 'present' | 'absent' | 'no_record'
        note: record ? record.note : '',
        workingProjectId: record ? (record.workingProjectId || '') : '',
        workingProjectName: record ? (record.workingProjectName || '') : '',
        dailyWorkload: record ? (record.dailyWorkload || '') : '',
        isWorkingAtWorkshop: record ? (record.isWorkingAtWorkshop === true || record.isWorkingAtWorkshop === 'true') : false
      };
    });
  },

  // Get today's attendance for a single user
  getUserAttendanceToday(userId) {
    const db = this.load();
    if (!db.attendance) db.attendance = [];
    const today = new Date().toISOString().split('T')[0];
    return db.attendance.find(a => a.userId === userId && a.date === today) || null;
  },

  // Self Check-in
  checkIn(userId, note) {
    const db = this.load();
    if (!db.attendance) db.attendance = [];
    const today = new Date().toISOString().split('T')[0];
    const time = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    const existing = db.attendance.find(a => a.userId === userId && a.date === today);
    if (existing) {
      existing.time = time;
      existing.status = 'present';
      existing.note = note;
    } else {
      db.attendance.push({
        userId,
        date: today,
        time,
        status: 'present',
        note
      });
    }

    this.save(db);
    return today;
  },

  // Manager updates attendance
  updateAttendance(userId, date, status, time, note, workingProjectId = '', workingProjectName = '', dailyWorkload = '', isWorkingAtWorkshop = false) {
    const db = this.load();
    if (!db.attendance) db.attendance = [];

    const existing = db.attendance.find(a => a.userId === userId && a.date === date);
    if (existing) {
      existing.status = status;
      existing.time = time;
      existing.note = note;
      existing.workingProjectId = workingProjectId;
      existing.workingProjectName = workingProjectName;
      existing.dailyWorkload = dailyWorkload;
      existing.isWorkingAtWorkshop = isWorkingAtWorkshop;
    } else {
      db.attendance.push({
        userId,
        date,
        status,
        time,
        note,
        workingProjectId,
        workingProjectName,
        dailyWorkload,
        isWorkingAtWorkshop
      });
    }

    this.save(db);
    return true;
  },

  // Get analytics data for Manager
  getAnalytics() {
    const db = this.load();
    const projects = db.projects;

    // 1. Biểu đồ luồng (Pipeline distribution)
    const pipeline = {
      design: 0,    // Giai đoạn 1: Thiết Kế
      workshop: 0,  // Giai đoạn 2: Gia Công Tại Xưởng
      onsite: 0,    // Giai đoạn 3: Lắp Ráp Tại Công Trình
      completed: 0  // Giai đoạn 4: Đã Bàn Giao
    };

    projects.forEach(p => {
      if (p.step === 1) pipeline.design++;
      else if (p.step === 2) pipeline.workshop++;
      else if (p.step === 3) pipeline.onsite++;
      else if (p.step === 4 || p.isCompleted) pipeline.completed++;
    });

    // 2. Tỷ lệ lỗi (Đỏ) & Phát sinh (Cam)
    let totalErrors = 0;
    let totalScopeChanges = 0;
    let delayReasons = {
      'Khách đổi ý/chậm duyệt': 0,
      'Sản xuất/Thi công sai lỗi': 0,
      'Tắc nghẽn hiện trường': 0,
      'Trễ vật tư/phụ kiện': 0
    };

    projects.forEach(p => {
      if (p.isRework) totalErrors++;
      if (p.isSmallScope || p.name.includes('[PHÁT SINH]')) totalScopeChanges++;

      // Analyze delay reasons from frozen projects and delayed logs (So khớp từ khóa tiếng Việt thông minh)
      if (p.isFrozen && p.freezeReason) {
        const reasonLower = p.freezeReason.toLowerCase();
        if (reasonLower.includes('khách') || reasonLower.includes('duyệt') || reasonLower.includes('đổi ý') || reasonLower.includes('ngâm') || reasonLower.includes('chờ')) {
          delayReasons['Khách đổi ý/chậm duyệt']++;
        } else if (reasonLower.includes('hiện trường') || reasonLower.includes('tắc') || reasonLower.includes('mặt bằng') || reasonLower.includes('chưa giao') || reasonLower.includes('vướng')) {
          delayReasons['Tắc nghẽn hiện trường']++;
        } else if (reasonLower.includes('vật tư') || reasonLower.includes('thiếu') || reasonLower.includes('phụ kiện') || reasonLower.includes('chưa về') || reasonLower.includes('gỗ') || reasonLower.includes('ray')) {
          delayReasons['Trễ vật tư/phụ kiện']++;
        }
      }

      // Analyze subtasks for reworks
      p.subtasks.forEach(st => {
        if (st.type === 'rework') {
          delayReasons['Sản xuất/Thi công sai lỗi']++;
        }
      });

      // Count notes
      p.dailyLogs.forEach(l => {
        if (l.approved !== false && l.status === 'delayed' && l.note) {
          const noteText = l.note.toLowerCase();
          if (noteText.includes('vật tư') || noteText.includes('thiếu') || noteText.includes('phụ kiện') || noteText.includes('chưa về') || noteText.includes('ray') || noteText.includes('gỗ') || noteText.includes('bản lề') || noteText.includes('trễ')) {
            delayReasons['Trễ vật tư/phụ kiện']++;
          }
        }
      });
    });

    // 3. Năng suất nhân sự (Động theo dữ liệu thực tế)
    // Designers (KTS)
    const ktsUsers = db.users.filter(u => u.role === 'kts');
    const designers = ktsUsers.map(u => {
      let frozenCount = 0;
      projects.forEach(p => {
        p.history.forEach(h => {
          if (h.action.includes('Đóng băng') && (p.subtasks.some(st => st.assignedTo === u.id) || h.action.includes(u.name))) {
            frozenCount++;
          }
        });
      });
      return {
        name: u.name,
        frozenCount: frozenCount
      };
    });

    // Assembly workers / Teams
    const workerUsers = db.users.filter(u => u.role === 'lead_worker' || u.role === 'assistant_worker');
    const teams = workerUsers.map(u => {
      let completedOnTime = 0;
      let errorCount = 0;
      projects.forEach(p => {
        p.subtasks.forEach(st => {
          if (st.assignedTo === u.id) {
            if (st.status === 'completed') {
              completedOnTime++;
            }
            if (st.type === 'rework') {
              errorCount++;
            }
          }
        });
      });
      return {
        name: u.name,
        completedOnTime: completedOnTime,
        errorCount: errorCount
      };
    });

    return {
      pipeline,
      errorsCount: totalErrors,
      scopeCount: totalScopeChanges,
      delayReasons,
      designers,
      teams
    };
  },

  // Delete project completely (Xóa công trình)
  deleteProject(projectId, userId) {
    const db = this.load();
    const prjIdx = db.projects.findIndex(p => p.id === projectId);
    if (prjIdx > -1) {
      const prj = db.projects[prjIdx];
      db.projects.splice(prjIdx, 1);
      
      const user = db.users.find(u => u.id === userId);
      db.systemLogs.push({
        timestamp: new Date().toISOString(),
        action: `Xóa hoàn toàn công trình: "${prj.name}"`,
        user: user ? user.name : 'Sếp'
      });

      this.save(db);
      return true;
    }
    return false;
  },

  updateProjectInfo(projectId, newName, newDeadline, userId, assignees = null, scope = null) {
    const db = this.load();
    const project = db.projects.find(p => p.id === projectId);
    if (project) {
      const oldName = project.name;
      const oldDeadline = project.deadline;
      
      project.name = newName;
      project.deadline = newDeadline;

      if (assignees !== null) {
        project.assignees = assignees;
      }
      if (scope !== null) {
        project.scope = scope;
      }

      const user = db.users.find(u => u.id === userId);
      const assigneesText = assignees ? ` | Giao phụ trách: [${assignees.map(id => db.users.find(u => u.id === id)?.name || id).join(', ')}]` : '';

      project.history.push({
        timestamp: new Date().toISOString(),
        action: `Sửa thông tin công trình: Tên "${oldName}" -> "${newName}", Hạn "${oldDeadline}" -> "${newDeadline}"${assigneesText}${scope ? ' | Cập nhật hạng mục thi công' : ''}`,
        user: user ? user.name : 'Sếp'
      });

      this.save(db);
      return project;
    }
    return null;
  },

  // Add a scope item to a project
  addScopeItem(projectId, room, item, userId) {
    const db = this.load();
    const project = db.projects.find(p => p.id === projectId);
    const user = db.users.find(u => u.id === userId);
    if (project) {
      if (!project.scope) project.scope = [];
      project.scope.push({ room: room.trim(), item: item.trim() });
      project.history.push({
        timestamp: new Date().toISOString(),
        action: `Thêm hạng mục thi công: [${room}] - ${item}`,
        user: user ? user.name : 'Sếp'
      });
      this.save(db);
      return project;
    }
    return null;
  },

  // Edit a scope item in a project (by index)
  editScopeItem(projectId, scopeIndex, newRoom, newItem, userId) {
    const db = this.load();
    const project = db.projects.find(p => p.id === projectId);
    const user = db.users.find(u => u.id === userId);
    if (project && project.scope && project.scope[scopeIndex] !== undefined) {
      const old = project.scope[scopeIndex];
      project.scope[scopeIndex] = { room: newRoom.trim(), item: newItem.trim() };
      project.history.push({
        timestamp: new Date().toISOString(),
        action: `Sửa hạng mục: [${old.room} - ${old.item}] → [${newRoom} - ${newItem}]`,
        user: user ? user.name : 'Sếp'
      });
      this.save(db);
      return project;
    }
    return null;
  },

  // Delete a scope item from a project (by index)
  deleteScopeItem(projectId, scopeIndex, userId) {
    const db = this.load();
    const project = db.projects.find(p => p.id === projectId);
    const user = db.users.find(u => u.id === userId);
    if (project && project.scope && project.scope[scopeIndex] !== undefined) {
      const removed = project.scope.splice(scopeIndex, 1)[0];
      project.history.push({
        timestamp: new Date().toISOString(),
        action: `Xóa hạng mục thi công: [${removed.room}] - ${removed.item}`,
        user: user ? user.name : 'Sếp'
      });
      this.save(db);
      return project;
    }
    return null;
  },

  // Edit daily log (Chỉnh sửa báo cáo nhật ký hàng ngày)
  editDailyLog(projectId, logId, note, status, expectedCompletionDate, photos, items, userId, approverId = undefined) {
    const db = this.load();
    const project = db.projects.find(p => p.id === projectId);
    const user = db.users.find(u => u.id === userId);
    if (project && project.dailyLogs) {
      const log = project.dailyLogs.find(l => l.id === logId);
      if (log) {
        log.note = note;
        log.status = status;
        log.expectedCompletionDate = expectedCompletionDate;
        if (photos !== undefined) log.photos = photos;
        if (items !== undefined) log.items = items;
        if (approverId !== undefined) log.approverId = approverId;
        
        project.history.push({
          timestamp: new Date().toISOString(),
          action: `Chỉnh sửa báo cáo của: ${log.reporterName} (Ngày: ${log.date})`,
          user: user ? user.name : 'Nhân viên'
        });

        this.save(db);
        return true;
      }
    }
    return false;
  },

  // Delete daily log (Xóa báo cáo nhật ký hàng ngày)
  deleteDailyLog(projectId, logId, userId) {
    const db = this.load();
    const project = db.projects.find(p => p.id === projectId);
    const user = db.users.find(u => u.id === userId);
    if (project && project.dailyLogs) {
      const idx = project.dailyLogs.findIndex(l => l.id === logId);
      if (idx > -1) {
        const removed = project.dailyLogs[idx];
        project.dailyLogs.splice(idx, 1);
        
        project.history.push({
          timestamp: new Date().toISOString(),
          action: `Xóa báo cáo của: ${removed.reporterName} (Ngày: ${removed.date})`,
          user: user ? user.name : 'Sếp'
        });

        this.save(db);
        return true;
      }
    }
    return false;
  },

  setSelectedLeadWorkerForAssistant(assistantId, leadWorkerId) {
    localStorage.setItem(`selected_lead_worker_${assistantId}`, leadWorkerId);
  },

  getSelectedLeadWorkerForAssistant(assistantId) {
    return localStorage.getItem(`selected_lead_worker_${assistantId}`) || '';
  }
};
