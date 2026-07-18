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

  // Auto-migration helper from old monolithic table to the new tables
  async migrateMonolithicToRelational(oldDb) {
    try {
      console.log('Migrating users to relational users table...');
      if (oldDb.users && oldDb.users.length > 0) {
        await supabaseClient.from('users').delete().neq('id', '');
        await supabaseClient.from('users').insert(oldDb.users);
      }

      console.log('Migrating projects and nested structures to relational tables...');
      if (oldDb.projects && oldDb.projects.length > 0) {
        await supabaseClient.from('projects').delete().neq('id', '');
        
        for (const p of oldDb.projects) {
          // Insert project
          await supabaseClient.from('projects').insert({
            id: p.id,
            name: p.name,
            step: p.step,
            deadline: p.deadline,
            original_deadline: p.originalDeadline,
            is_completed: p.isCompleted || false,
            is_rework: p.isRework || false,
            is_small_scope: p.isSmallScope || false,
            assignees: p.assignees || [],
            scope: p.scope || []
          });

          // Insert subtasks
          if (p.subtasks && p.subtasks.length > 0) {
            const mappedSubtasks = p.subtasks.map(st => ({
              id: st.id,
              project_id: p.id,
              title: st.title,
              assigned_to: st.assignedTo,
              status: st.status,
              type: st.type || 'standard',
              completed_at: st.completedAt || null,
              items: st.items || []
            }));
            await supabaseClient.from('subtasks').insert(mappedSubtasks);
          }

          // Insert daily logs
          if (p.dailyLogs && p.dailyLogs.length > 0) {
            const mappedLogs = p.dailyLogs.map(dl => ({
              id: dl.id,
              project_id: p.id,
              date: dl.date,
              reporter_id: dl.reporterId,
              reporter_name: dl.reporterName,
              reporter_role: dl.reporterRole,
              status: dl.status,
              note: dl.note,
              photos: dl.photos || [],
              expected_completion_date: dl.expectedCompletionDate || null,
              items: dl.items || [],
              approved: dl.approved !== false,
              approver_id: dl.approverId || null
            }));
            await supabaseClient.from('daily_logs').insert(mappedLogs);
          }

          // Insert history
          if (p.history && p.history.length > 0) {
            const mappedHistory = p.history.map(h => ({
              project_id: p.id,
              timestamp: h.timestamp,
              action: h.action,
              user: h.user
            }));
            await supabaseClient.from('project_history').insert(mappedHistory);
          }
        }
      }

      console.log('Migrating attendance...');
      if (oldDb.attendance && oldDb.attendance.length > 0) {
        await supabaseClient.from('attendance').delete().neq('id', 0);
        const mappedAttendance = oldDb.attendance.map(a => ({
          user_id: a.userId,
          date: a.date,
          time: a.time || null,
          status: a.status,
          note: a.note || null,
          working_project_id: a.workingProjectId || null,
          working_project_name: a.workingProjectName || null,
          daily_workload: a.dailyWorkload || null,
          is_working_at_workshop: a.isWorkingAtWorkshop || false
        }));
        await supabaseClient.from('attendance').insert(mappedAttendance);
      }

      // Clear monolithic app_state row to finalize migration
      await supabaseClient.from('app_state').delete().eq('id', 1);
      console.log('Relational migration completed successfully!');
    } catch (err) {
      console.error('Error during relational migration:', err);
    }
  },

  // Triggered in app.js on startup and periodically (polling)
  async syncWithServer(onSyncComplete = null) {
    if (supabaseClient) {
      try {
        // Fetch all tables from Supabase in parallel
        const [
          { data: users, error: errUsers },
          { data: projects, error: errProjects },
          { data: subtasks, error: errSubtasks },
          { data: dailyLogs, error: errDailyLogs },
          { data: attendance, error: errAttendance },
          { data: history, error: errHistory }
        ] = await Promise.all([
          supabaseClient.from('users').select('*'),
          supabaseClient.from('projects').select('*'),
          supabaseClient.from('subtasks').select('*'),
          supabaseClient.from('daily_logs').select('*'),
          supabaseClient.from('attendance').select('*'),
          supabaseClient.from('project_history').select('*')
        ]);

        if (errUsers || errProjects || errSubtasks || errDailyLogs || errAttendance || errHistory) {
          console.warn('Error fetching relational tables from Supabase. Relational tables might not exist yet.');
          return false;
        }

        // Auto-migration check: If projects table is empty, look for monolithic table backups
        if (projects.length === 0) {
          let oldState = null;
          try {
            const { data } = await supabaseClient.from('app_state').select('data').eq('id', 1).maybeSingle();
            oldState = data;
          } catch (e) {
            console.log('app_state table might already be deleted or not accessible:', e);
          }

          if (oldState && oldState.data && oldState.data.projects && oldState.data.projects.length > 0) {
            await this.migrateMonolithicToRelational(oldState.data);
            return this.syncWithServer(onSyncComplete);
          } else {
            // Seed default users if users table is empty
            if (users.length === 0) {
              await supabaseClient.from('users').insert(DEFAULT_USERS);
              return this.syncWithServer(onSyncComplete);
            }
          }
        }

        // Assemble relational data into monolithic db structure for local storage
        const assembledDb = {
          users: users || [],
          projects: (projects || []).map(p => {
            return {
              id: p.id,
              name: p.name,
              step: p.step,
              deadline: p.deadline,
              originalDeadline: p.original_deadline,
              isCompleted: p.is_completed,
              isRework: p.is_rework,
              isSmallScope: p.is_small_scope,
              assignees: p.assignees || [],
              scope: p.scope || [],
              subtasks: (subtasks || []).filter(st => st.project_id === p.id).map(st => ({
                id: st.id,
                title: st.title,
                assignedTo: st.assigned_to,
                status: st.status,
                type: st.type,
                completedAt: st.completed_at,
                items: st.items || []
              })),
              dailyLogs: (dailyLogs || []).filter(dl => dl.project_id === p.id).map(dl => ({
                id: dl.id,
                date: dl.date,
                reporterId: dl.reporter_id,
                reporterName: dl.reporter_name,
                reporterRole: dl.reporter_role,
                status: dl.status,
                note: dl.note,
                photos: dl.photos || [],
                expectedCompletionDate: dl.expected_completion_date,
                items: dl.items || [],
                approved: dl.approved,
                approverId: dl.approver_id
              })),
              history: (history || []).filter(h => h.project_id === p.id).map(h => ({
                timestamp: h.timestamp,
                action: h.action,
                user: h.user
              }))
            };
          }),
          attendance: (attendance || []).map(a => ({
            userId: a.user_id,
            date: a.date,
            time: a.time,
            status: a.status,
            note: a.note,
            workingProjectId: a.working_project_id,
            workingProjectName: a.working_project_name,
            dailyWorkload: a.daily_workload,
            isWorkingAtWorkshop: a.is_working_at_workshop
          })),
          systemLogs: []
        };

        // Sort items chronologically
        assembledDb.projects.forEach(p => {
          p.history.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
          p.dailyLogs.sort((a, b) => b.date.localeCompare(a.date));
        });

        localStorage.setItem(DB_KEY, JSON.stringify(assembledDb));
        console.log('Database synced from Supabase (relational tables).');
        if (onSyncComplete) onSyncComplete(assembledDb);
        return true;
      } catch (err) {
        console.error('Relational sync failed:', err);
      }
      return false;
    }
    return false;
  },

  // Relational writes helpers (Background, non-blocking)
  async sbUpdateProject(projectId, fields) {
    if (!supabaseClient) return;
    try {
      await supabaseClient.from('projects').update(fields).eq('id', projectId);
    } catch (e) {
      console.error('Supabase write error:', e);
    }
  },

  async sbInsertProject(p) {
    if (!supabaseClient) return;
    try {
      await supabaseClient.from('projects').insert({
        id: p.id,
        name: p.name,
        step: p.step,
        deadline: p.deadline,
        original_deadline: p.originalDeadline,
        is_completed: p.isCompleted || false,
        is_rework: p.isRework || false,
        is_small_scope: p.isSmallScope || false,
        assignees: p.assignees || [],
        scope: p.scope || []
      });
    } catch (e) {
      console.error('Supabase write error:', e);
    }
  },

  async sbDeleteProject(projectId) {
    if (!supabaseClient) return;
    try {
      await supabaseClient.from('projects').delete().eq('id', projectId);
    } catch (e) {
      console.error('Supabase write error:', e);
    }
  },

  async sbInsertSubtask(st, projectId) {
    if (!supabaseClient) return;
    try {
      await supabaseClient.from('subtasks').insert({
        id: st.id,
        project_id: projectId,
        title: st.title,
        assigned_to: st.assignedTo,
        status: st.status,
        type: st.type,
        completed_at: st.completedAt || null,
        items: st.items || []
      });
    } catch (e) {
      console.error('Supabase write error:', e);
    }
  },

  async sbUpdateSubtask(subtaskId, fields) {
    if (!supabaseClient) return;
    try {
      await supabaseClient.from('subtasks').update(fields).eq('id', subtaskId);
    } catch (e) {
      console.error('Supabase write error:', e);
    }
  },

  async sbDeleteSubtask(subtaskId) {
    if (!supabaseClient) return;
    try {
      await supabaseClient.from('subtasks').delete().eq('id', subtaskId);
    } catch (e) {
      console.error('Supabase write error:', e);
    }
  },

  async sbInsertDailyLog(dl, projectId) {
    if (!supabaseClient) return;
    try {
      await supabaseClient.from('daily_logs').insert({
        id: dl.id,
        project_id: projectId,
        date: dl.date,
        reporter_id: dl.reporterId,
        reporter_name: dl.reporterName,
        reporter_role: dl.reporterRole,
        status: dl.status,
        note: dl.note,
        photos: dl.photos || [],
        expected_completion_date: dl.expectedCompletionDate || null,
        items: dl.items || [],
        approved: dl.approved !== false,
        approver_id: dl.approverId || null
      });
    } catch (e) {
      console.error('Supabase write error:', e);
    }
  },

  async sbUpdateDailyLog(logId, fields) {
    if (!supabaseClient) return;
    try {
      await supabaseClient.from('daily_logs').update(fields).eq('id', logId);
    } catch (e) {
      console.error('Supabase write error:', e);
    }
  },

  async sbDeleteDailyLog(logId) {
    if (!supabaseClient) return;
    try {
      await supabaseClient.from('daily_logs').delete().eq('id', logId);
    } catch (e) {
      console.error('Supabase write error:', e);
    }
  },

  async sbUpsertAttendance(userId, date, fields) {
    if (!supabaseClient) return;
    try {
      const { data } = await supabaseClient
        .from('attendance')
        .select('id')
        .eq('user_id', userId)
        .eq('date', date);
      
      const payload = {
        user_id: userId,
        date: date,
        time: fields.time || null,
        status: fields.status,
        note: fields.note || null,
        working_project_id: fields.workingProjectId || null,
        working_project_name: fields.workingProjectName || null,
        daily_workload: fields.dailyWorkload || null,
        is_working_at_workshop: fields.isWorkingAtWorkshop || false
      };

      if (data && data.length > 0) {
        await supabaseClient.from('attendance').update(payload).eq('user_id', userId).eq('date', date);
      } else {
        await supabaseClient.from('attendance').insert(payload);
      }
    } catch (e) {
      console.error('Supabase write error:', e);
    }
  },

  async sbInsertHistory(h, projectId) {
    if (!supabaseClient) return;
    try {
      await supabaseClient.from('project_history').insert({
        project_id: projectId,
        timestamp: h.timestamp,
        action: h.action,
        user: h.user
      });
    } catch (e) {
      console.error('Supabase write error:', e);
    }
  },

  // Remote reset database trigger
  async resetServerDb() {
    if (supabaseClient) {
      try {
        await supabaseClient.from('projects').delete().neq('id', '');
        await supabaseClient.from('attendance').delete().neq('id', 0);
        await supabaseClient.from('users').delete().neq('id', '');
        await supabaseClient.from('users').insert(DEFAULT_USERS);
        
        const seedDb = {
          users: DEFAULT_USERS,
          projects: [],
          attendance: [],
          systemLogs: []
        };
        localStorage.setItem(DB_KEY, JSON.stringify(seedDb));
        localStorage.removeItem('furni_session');
        return true;
      } catch (e) {
        console.error('Failed to reset database on Supabase.', e);
      }
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
    }
    
    return db;
  },

  // Save database to localStorage
  save(data) {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
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
  async advanceProject(projectId, userId) {
    const db = this.load();
    const project = db.projects.find(p => p.id === projectId);
    const user = db.users.find(u => u.id === userId);

    if (project && project.step < 4) {
      if (project.isRework && project.subtasks.some(st => st.type === 'rework' && st.status === 'pending')) {
        throw new Error('Không thể tiến hành khi có NHIỆM VỤ SỬA LỖI chưa hoàn thành.');
      }

      project.step += 1;
      const hist = {
        timestamp: new Date().toISOString(),
        action: `Chuyển tiến độ sang Giai đoạn ${project.step}`,
        user: user ? user.name : 'Nhân viên'
      };
      project.history.push(hist);
      this.save(db);
      
      await this.sbUpdateProject(projectId, { step: project.step });
      await this.sbInsertHistory(hist, projectId);
      return project;
    }
    return null;
  },

  // Complete project entirely (Hoàn thành bàn giao)
  async completeProject(projectId, userId) {
    const db = this.load();
    const project = db.projects.find(p => p.id === projectId);
    const user = db.users.find(u => u.id === userId);

    if (project) {
      project.isCompleted = true;
      project.completedAt = new Date().toISOString();
      const hist = {
        timestamp: new Date().toISOString(),
        action: `Hoàn thành công trình toàn bộ, đóng hồ sơ bàn giao`,
        user: user ? user.name : 'Sếp'
      };
      project.history.push(hist);
      this.save(db);
      
      await this.sbUpdateProject(projectId, { is_completed: true });
      await this.sbInsertHistory(hist, projectId);
      return project;
    }
    return null;
  },

  // Rework (Sửa hàng lỗi)
  async triggerRework(projectId, taskTitle, assignedWorkerId, userId) {
    const db = this.load();
    const project = db.projects.find(p => p.id === projectId);
    const user = db.users.find(u => u.id === userId);
    const worker = db.users.find(u => u.id === assignedWorkerId);

    if (project) {
      project.isRework = true;
      const subtaskId = 'sub_' + Math.random().toString(36).substr(2, 9);
      const st = {
        id: subtaskId,
        title: taskTitle,
        assignedTo: assignedWorkerId,
        status: 'pending',
        type: 'rework'
      };

      project.subtasks.push(st);

      const hist = {
        timestamp: new Date().toISOString(),
        action: `Báo lỗi & Yêu cầu sửa hàng: "${taskTitle}" (Giao cho: ${worker ? worker.name : 'Chưa rõ'})`,
        user: user ? user.name : 'Nhân viên'
      };
      project.history.push(hist);

      this.save(db);
      
      await this.sbInsertSubtask(st, projectId);
      await this.sbUpdateProject(projectId, { is_rework: true });
      await this.sbInsertHistory(hist, projectId);
      return project;
    }
    return null;
  },

  // Resolve subtask (normal or rework or small scope)
  async completeSubtask(projectId, subtaskId, userId) {
    const db = this.load();
    const project = db.projects.find(p => p.id === projectId);
    const user = db.users.find(u => u.id === userId);

    if (project) {
      const task = project.subtasks.find(st => st.id === subtaskId);
      if (task) {
        task.status = 'completed';
        task.completedAt = new Date().toISOString();
        task.items = [{ progress: 100, pendingNotes: '', expectedCompletionDate: '' }];

        const hist = {
          timestamp: new Date().toISOString(),
          action: `Hoàn thành nhiệm vụ: "${task.title}"`,
          user: user ? user.name : 'Nhân viên'
        };
        project.history.push(hist);

        // Check if there are any pending rework tasks left
        const hasPendingRework = project.subtasks.some(st => st.type === 'rework' && st.status === 'pending');
        if (!hasPendingRework) {
          project.isRework = false;
        }

        this.save(db);
        
        await this.sbUpdateSubtask(subtaskId, { status: task.status, completed_at: task.completedAt, items: task.items });
        await this.sbUpdateProject(projectId, { is_rework: project.isRework });
        await this.sbInsertHistory(hist, projectId);
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

        const hist = {
          timestamp: new Date().toISOString(),
          action: `Xóa nhiệm vụ: "${task.title}"`,
          user: user ? user.name : 'Sếp'
        };
        project.history.push(hist);

        this.save(db);
        
        this.sbDeleteSubtask(subtaskId);
        this.sbUpdateProject(projectId, { is_rework: project.isRework });
        this.sbInsertHistory(hist, projectId);
        return project;
      }
    }
    return null;
  },

  // Add Small Scope Hạng mục Phát sinh Nhỏ
  async addSmallScope(projectId, description, extendDays = 2, assignedWorkerId, userId) {
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
      const st = {
        id: subtaskId,
        title: `[PHÁT SINH NHỎ] ${description}`,
        assignedTo: assignedWorkerId,
        status: 'pending',
        type: 'small_scope'
      };
      project.subtasks.push(st);

      const hist = {
        timestamp: new Date().toISOString(),
        action: `Thêm phát sinh nhỏ: "${description}" (+${extendDays} ngày deadline, Giao cho: ${worker ? worker.name : 'Chưa rõ'})`,
        user: user ? user.name : 'Nhân viên'
      };
      project.history.push(hist);

      this.save(db);
      
      await this.sbInsertSubtask(st, projectId);
      await this.sbUpdateProject(projectId, { is_small_scope: true, deadline: project.deadline });
      await this.sbInsertHistory(hist, projectId);
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
    
    this.sbInsertProject(newProject);
    this.sbInsertHistory(newProject.history[0], newProject.id);
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

      // Needs approval if: is assistant AND selected a specific lead worker (not empty or 'independent')
      const needsApproval = isAssistant && approverId && approverId !== 'independent';

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

      const hist = {
        timestamp: new Date().toISOString(),
        action: needsApproval 
          ? `Gửi báo cáo thợ phụ (Chờ thợ chính duyệt): Trạng thái [${status === 'on_track' ? 'Đúng tiến độ' : 'Bị chậm'}], Dự kiến xong: ${expectedCompletionDate || 'Chưa đặt'}`
          : `Gửi báo cáo thợ phụ (Làm độc lập - Tự duyệt): Trạng thái [${status === 'on_track' ? 'Đúng tiến độ' : 'Bị chậm'}], Dự kiến xong: ${expectedCompletionDate || 'Chưa đặt'}`,
        user: user ? user.name : 'Nhân viên'
      };
      project.history.push(hist);

      this.save(db);
      
      this.sbInsertDailyLog(newLog, projectId);
      this.sbInsertHistory(hist, projectId);
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

        const hist = {
          timestamp: new Date().toISOString(),
          action: `Phê duyệt báo cáo của thợ phụ: Trạng thái [${status === 'on_track' ? 'Đúng tiến độ' : 'Bị chậm'}], Dự kiến xong: ${expectedCompletionDate || 'Chưa đặt'}`,
          user: leadUser ? leadUser.name : 'Thợ chính'
        };
        project.history.push(hist);

        this.save(db);
        
        this.sbUpdateDailyLog(logId, {
          status: log.status,
          note: log.note,
          expected_completion_date: log.expectedCompletionDate,
          items: log.items,
          photos: log.photos,
          approved: true,
          approver_id: leadUserId
        });
        this.sbInsertHistory(hist, projectId);
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
    
    this.sbUpsertAttendance(userId, today, {
      time,
      status: 'present',
      note
    });
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
    
    this.sbUpsertAttendance(userId, date, {
      status,
      time,
      note,
      workingProjectId,
      workingProjectName,
      dailyWorkload,
      isWorkingAtWorkshop
    });
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
      db.projects.splice(prjIdx, 1);
      
      const user = db.users.find(u => u.id === userId);
      db.systemLogs.push({
        timestamp: new Date().toISOString(),
        action: `Xóa hoàn toàn công trình`,
        user: user ? user.name : 'Sếp'
      });

      this.save(db);
      
      this.sbDeleteProject(projectId);
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

      const hist = {
        timestamp: new Date().toISOString(),
        action: `Sửa thông tin công trình: Tên "${oldName}" -> "${newName}", Hạn "${oldDeadline}" -> "${newDeadline}"${assigneesText}${scope ? ' | Cập nhật hạng mục thi công' : ''}`,
        user: user ? user.name : 'Sếp'
      };
      project.history.push(hist);

      this.save(db);
      
      this.sbUpdateProject(projectId, {
        name: newName,
        deadline: newDeadline,
        assignees: project.assignees,
        scope: project.scope
      });
      this.sbInsertHistory(hist, projectId);
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
      const hist = {
        timestamp: new Date().toISOString(),
        action: `Thêm hạng mục thi công: [${room}] - ${item}`,
        user: user ? user.name : 'Sếp'
      };
      project.history.push(hist);
      this.save(db);
      
      this.sbUpdateProject(projectId, { scope: project.scope });
      this.sbInsertHistory(hist, projectId);
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
      const hist = {
        timestamp: new Date().toISOString(),
        action: `Sửa hạng mục: [${old.room} - ${old.item}] → [${newRoom} - ${newItem}]`,
        user: user ? user.name : 'Sếp'
      };
      project.history.push(hist);
      this.save(db);
      
      this.sbUpdateProject(projectId, { scope: project.scope });
      this.sbInsertHistory(hist, projectId);
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
      const hist = {
        timestamp: new Date().toISOString(),
        action: `Xóa hạng mục thi công: [${removed.room}] - ${removed.item}`,
        user: user ? user.name : 'Sếp'
      };
      project.history.push(hist);
      this.save(db);
      
      this.sbUpdateProject(projectId, { scope: project.scope });
      this.sbInsertHistory(hist, projectId);
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
        
        const hist = {
          timestamp: new Date().toISOString(),
          action: `Chỉnh sửa báo cáo của: ${log.reporterName} (Ngày: ${log.date})`,
          user: user ? user.name : 'Nhân viên'
        };
        project.history.push(hist);

        this.save(db);
        
        this.sbUpdateDailyLog(logId, {
          note: log.note,
          status: log.status,
          expected_completion_date: log.expectedCompletionDate,
          photos: log.photos,
          items: log.items,
          approver_id: log.approverId
        });
        this.sbInsertHistory(hist, projectId);
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
        
        const hist = {
          timestamp: new Date().toISOString(),
          action: `Xóa báo cáo của: ${removed.reporterName} (Ngày: ${removed.date})`,
          user: user ? user.name : 'Sếp'
        };
        project.history.push(hist);

        this.save(db);
        
        this.sbDeleteDailyLog(logId);
        this.sbInsertHistory(hist, projectId);
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
