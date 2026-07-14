import { DB } from './db.js';
import { Toast, Modal, MockImages } from './components.js';

export const STEPS = [
  { num: 1, title: 'Thiết Kế', icon: 'fa-drafting-compass', desc: 'Lên phương án phối cảnh 2D/3D & chốt báo giá' },
  { num: 2, title: 'Gia Công Tại Xưởng', icon: 'fa-industry', desc: 'Sản xuất, cắt CNC, dán cạnh và ráp thử tại xưởng' },
  { num: 3, title: 'Lắp Ráp Tại Công Trình', icon: 'fa-truck-moving', desc: 'Vận chuyển & lắp ráp hoàn thiện tại công trình' },
  { num: 4, title: 'Đã Bàn Giao', icon: 'fa-file-signature', desc: 'Vệ sinh, nghiệm thu bàn giao cho chủ nhà' }
];

export const DEFAULT_SCOPE_TEMPLATE = {
  'Phòng ngủ': ['Tủ áo', 'Bàn trang điểm', 'Giường', 'Tủ đầu giường', 'Vách trang trí', 'Khác...'],
  'Phòng khách': ['Tủ giày', 'Vách trang trí', 'Kệ TV', 'Sofa', 'Bàn trà', 'Khác...'],
  'Phòng bếp': ['Bếp trên', 'Bếp dưới', 'Tủ đồ khô', 'Quầy bar', 'Bàn ăn', 'Khác...'],
  'Phòng thờ': ['Bàn thờ', 'Vách CNC', 'Khác...'],
  'Phòng tắm': ['Lavabo', 'Tủ gương', 'Khác...']
};

export const UI = {
  // Main container
  getAppContainer() {
    return document.getElementById('app');
  },

  // 1. RENDER LOGIN SCREEN
  renderLogin(onLoginSuccess) {
    const container = this.getAppContainer();
    container.innerHTML = `
      <div class="login-container">
        <div class="login-bg" style="background: linear-gradient(180deg, rgba(15, 15, 17, 0.4) 0%, #0F0F11 100%), url('bg.jpg') center center / cover no-repeat, url('https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80') center center / cover no-repeat;"></div>
        <div class="login-card" style="position:relative;">
          <!-- Theme Toggler on Login -->
          <button class="header-btn" id="login-theme-toggle" style="position:absolute; top:16px; right:16px; z-index:10; border:1px solid var(--border-color);" title="Chuyển chế độ Sáng/Tối">
            <i class="fas fa-moon"></i>
          </button>
          
          <div class="login-header">
            <div class="login-logo" style="background: none; box-shadow: none; width: auto; height: 80px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px;">
              <img src="logo.png" onerror="this.onerror=null; this.src='logo.jpg'; this.onerror=() => { this.onerror=null; this.src='logo.jpeg'; this.onerror=() => { this.onerror=null; this.src='logo.svg'; this.onerror=() => { this.style.display='none'; this.nextElementSibling.style.display='flex'; } } }" style="height: 100%; max-width: 180px; object-fit: contain; border-radius: 14px;">
              <div class="fallback-logo" style="width: 64px; height: 64px; background: linear-gradient(135deg, var(--primary), #8E714B); border-radius: 18px; display: none; align-items: center; justify-content: center; color: var(--bg-primary); font-size: 1.75rem; box-shadow: var(--shadow-primary); margin: 0 auto;">
                <i class="fas fa-couch"></i>
              </div>
            </div>
            <h2 class="login-title">Mộc Tiên Phát</h2>
            <p class="login-subtitle">Hệ thống báo cáo thi công & quản lý nội thất</p>
          </div>
          
          <form id="login-form">
            <div class="form-group">
              <label class="form-label">Tên đăng nhập</label>
              <div class="input-wrapper">
                <input type="text" id="username" class="form-input" placeholder="Nhập tên đăng nhập..." required autocomplete="username">
                <i class="fas fa-user input-icon"></i>
              </div>
            </div>
            
            <div class="form-group">
              <label class="form-label">Mật khẩu</label>
              <div class="input-wrapper">
                <input type="password" id="password" class="form-input" placeholder="Nhập mật khẩu..." required autocomplete="current-password">
                <i class="fas fa-lock input-icon"></i>
              </div>
            </div>
            
            <div class="login-options">
              <label class="remember-me">
                <input type="checkbox" checked> Ghi nhớ đăng nhập
              </label>
            </div>
            
            <button type="submit" class="btn-primary" id="login-submit-btn">
              <span>Đăng Nhập</span>
              <i class="fas fa-arrow-right"></i>
            </button>
          </form>
          
        </div>
      </div>
    `;

    // Handle Form Submit
    document.getElementById('login-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const u = document.getElementById('username').value;
      const p = document.getElementById('password').value;

      const user = DB.login(u, p);
      if (user) {
        Toast.success(`Chào mừng ${user.name} quay trở lại!`);
        onLoginSuccess(user);
      } else {
        Toast.error('Sai tên đăng nhập hoặc mật khẩu!');
      }
    });

    // Handle Login Theme Switcher
    const loginThemeBtn = document.getElementById('login-theme-toggle');
    if (loginThemeBtn) {
      const currentTheme = localStorage.getItem('furni_theme') || 'dark';
      loginThemeBtn.innerHTML = currentTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
      loginThemeBtn.addEventListener('click', () => {
        const activeTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', activeTheme);
        localStorage.setItem('furni_theme', activeTheme);
        loginThemeBtn.innerHTML = activeTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
      });
    }
  },

  // 2. RENDER MAIN SHELL (App layout header & body)
  renderShell(user, onLogout, onTabSwitch) {
    const container = this.getAppContainer();
    container.innerHTML = `
      <div class="app-shell" id="app-shell-container">
        <header class="app-header">
          <div class="header-brand">
            <div class="header-logo" style="background: none; display: flex; align-items: center; justify-content: center; width: auto; height: 36px; padding: 0; box-shadow: none;">
              <img src="logo.png" onerror="this.onerror=null; this.src='logo.jpg'; this.onerror=() => { this.onerror=null; this.src='logo.jpeg'; this.onerror=() => { this.onerror=null; this.src='logo.svg'; this.onerror=() => { this.style.display='none'; this.nextElementSibling.style.display='flex'; } } }" style="height: 100%; max-width: 100px; object-fit: contain; border-radius: 6px;">
              <div class="fallback-header-logo" style="width: 32px; height: 32px; background: linear-gradient(135deg, var(--primary), #8E714B); border-radius: 8px; display: none; align-items: center; justify-content: center; color: var(--bg-primary); font-size: 0.9rem; box-shadow: var(--shadow-primary);">
                <i class="fas fa-couch"></i>
              </div>
            </div>
            <div class="header-title" style="margin-left: 8px;">Mộc Tiên Phát</div>
          </div>
          <div class="header-actions">
            <span class="user-role-tag" style="font-size: 0.8rem; font-weight:600; color:var(--primary); padding: 4px 8px; border-radius:8px; background-color:rgba(197,168,128,0.1)">
              ${user.role === 'manager' ? 'Sếp' : 'Nhân sự'}
            </span>
            <button class="header-btn" id="theme-toggle-btn" title="Chuyển chế độ Sáng/Tối">
              <i class="fas fa-moon"></i>
            </button>
            <button class="header-btn" id="logout-btn" title="Đăng xuất">
              <i class="fas fa-sign-out-alt"></i>
            </button>
          </div>
        </header>
        <main class="app-body" id="app-body-content">
          <!-- Dynanmic screen loaded here -->
        </main>
      </div>
    `;

    // Bind Theme toggle click in shell
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      const currentTheme = localStorage.getItem('furni_theme') || 'dark';
      themeBtn.innerHTML = currentTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
      themeBtn.addEventListener('click', () => {
        const activeTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', activeTheme);
        localStorage.setItem('furni_theme', activeTheme);
        themeBtn.innerHTML = activeTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        Toast.success(`Đã chuyển sang chế độ ${activeTheme === 'dark' ? 'Tối' : 'Sáng'}`);
      });
    }

    document.getElementById('logout-btn').addEventListener('click', () => {
      DB.logout();
      Toast.info('Đã đăng xuất.');
      onLogout();
    });
  },

  // 2.1 HELPER FOR DYNAMIC 3-LEVEL CHECKLIST ROW
  addChecklistItemRow(container, initialData = null, project = null) {
    const rowId = 'chk_' + Math.random().toString(36).substr(2, 9);
    const row = document.createElement('div');
    row.id = rowId;
    row.className = 'checklist-item-row';
    row.style.cssText = 'background: linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.01) 100%); border: 1px solid rgba(255, 255, 255, 0.08); border-left: 4px solid var(--primary); border-radius: 12px; padding: 14px; display: flex; flex-direction: column; gap: 10px; position: relative; box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 4px 12px rgba(0, 0, 0, 0.2);';

    const hasScope = project && project.scope && project.scope.length > 0;
    const rooms = hasScope ? [...new Set(project.scope.map(s => s.room))] : ['Phòng ngủ', 'Phòng khách', 'Phòng bếp', 'Phòng thờ', 'Phòng tắm', 'Khác...'];

    const roomVal = initialData ? initialData.room : '';
    const itemVal = initialData ? initialData.item : '';
    const isCompleted = initialData ? (initialData.isCompleted === true || initialData.isCompleted === 'true') : false;
    const pendingNotes = initialData ? initialData.pendingNotes : '';

    const isCustomRoom = roomVal && !rooms.includes(roomVal);

    // Dynamic initial items list
    let currentItemsList = [];
    if (roomVal) {
      if (hasScope) {
        currentItemsList = project.scope.filter(s => s.room === roomVal).map(s => s.item);
        if (itemVal && !currentItemsList.includes(itemVal)) {
          currentItemsList.push(itemVal);
        }
      } else {
        const fallbackMap = {
          'Phòng ngủ': ['Tủ áo', 'Bàn trang điểm', 'Giường', 'Tủ đầu giường', 'Vách trang trí', 'Khác...'],
          'Phòng khách': ['Tủ giày', 'Vách trang trí', 'Kệ TV', 'Sofa', 'Bàn trà', 'Khác...'],
          'Phòng bếp': ['Bếp trên', 'Bếp dưới', 'Tủ đồ khô', 'Quầy bar', 'Bàn ăn', 'Khác...'],
          'Phòng thờ': ['Bàn thờ', 'Vách CNC', 'Khác...'],
          'Phòng tắm': ['Lavabo', 'Tủ gương', 'Khác...']
        };
        currentItemsList = fallbackMap[roomVal] || ['Khác...'];
      }
    }

    const isCustomItem = itemVal && !currentItemsList.includes(itemVal);
    if (isCustomItem && !currentItemsList.includes('Khác...')) {
      currentItemsList.push('Khác...');
    }

    row.innerHTML = `
      <button type="button" class="btn-remove-chk-item" style="position: absolute; top: 10px; right: 10px; background: none; border: none; color: var(--status-rejected); font-size: 1.1rem; cursor: pointer; padding: 4px;" title="Xóa hạng mục này">
        <i class="fas fa-times-circle"></i>
      </button>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
        <div>
          <label class="form-label" style="font-size: 0.72rem; margin-bottom: 4px;">Cấp 1: Phòng</label>
          <select class="form-select select-chk-room" required style="padding: 6px 30px 6px 12px; height: 38px; font-size: 0.82rem;">
            <option value="" disabled ${!roomVal ? 'selected' : ''}>-- Chọn phòng --</option>
            ${rooms.map(r => `<option value="${r}" ${roomVal === r || (r === 'Khác...' && isCustomRoom) ? 'selected' : ''}>${r}</option>`).join('')}
          </select>
          <input type="text" class="form-input txt-chk-custom-room" placeholder="Nhập tên phòng khác..." style="margin-top: 6px; height: 36px; font-size: 0.8rem; display: ${isCustomRoom ? 'block' : 'none'}; padding-left: 10px;" value="${isCustomRoom ? roomVal : ''}" ${isCustomRoom ? 'required' : ''}>
        </div>

        <div>
          <label class="form-label" style="font-size: 0.72rem; margin-bottom: 4px;">Cấp 2: Nội thất</label>
          <select class="form-select select-chk-item" required style="padding: 6px 30px 6px 12px; height: 38px; font-size: 0.82rem;">
            <option value="" disabled ${!itemVal ? 'selected' : ''}>-- Chọn nội thất --</option>
            ${currentItemsList.map(f => `<option value="${f}" ${itemVal === f || (f === 'Khác...' && isCustomItem) ? 'selected' : ''}>${f}</option>`).join('')}
            ${(!roomVal) ? `<option value="" disabled selected>-- Chọn phòng trước --</option>` : ''}
          </select>
          <input type="text" class="form-input txt-chk-custom-item" placeholder="Nhập nội thất khác..." style="margin-top: 6px; height: 36px; font-size: 0.8rem; display: ${isCustomItem ? 'block' : 'none'}; padding-left: 10px;" value="${isCustomItem ? itemVal : ''}" ${isCustomItem ? 'required' : ''}>
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 6px; border-top: 1px solid rgba(255,255,255,0.03); padding-top: 8px;">
        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.8rem; font-weight: 600; width: max-content;">
          <input type="checkbox" class="chk-item-completed" ${isCompleted ? 'checked' : ''} style="width: 16px; height: 16px; accent-color: var(--status-approved);">
          <span>Đã hoàn thành xong hoàn toàn</span>
        </label>
        
        <div class="chk-pending-notes-wrapper" style="display: ${isCompleted ? 'none' : 'block'}; margin-top: 2px;">
          <label class="form-label" style="font-size: 0.72rem; margin-bottom: 4px; color: var(--status-pending);">Cấp 3: Việc còn lại cần làm (Nếu chưa xong)</label>
          <input type="text" class="form-input txt-chk-pending-notes" placeholder="Ví dụ: thiếu nẹp chỉ, chưa đi silicone, vỡ kính..." style="height: 36px; font-size: 0.8rem; padding-left: 10px;" value="${pendingNotes}" ${!isCompleted ? 'required' : ''}>
        </div>
      </div>
    `;

    container.appendChild(row);

    // Bind event listeners for dynamic UI behaviour
    const selectRoom = row.querySelector('.select-chk-room');
    const customRoom = row.querySelector('.txt-chk-custom-room');
    const selectItem = row.querySelector('.select-chk-item');
    const customItem = row.querySelector('.txt-chk-custom-item');

    selectRoom.addEventListener('change', () => {
      const val = selectRoom.value;
      if (val === 'Khác...') {
        customRoom.style.display = 'block';
        customRoom.required = true;

        selectItem.innerHTML = `<option value="Khác...">Khác...</option>`;
        customItem.style.display = 'block';
        customItem.required = true;
      } else {
        customRoom.style.display = 'none';
        customRoom.required = false;
        customRoom.value = '';

        let itemsList = [];
        if (hasScope) {
          itemsList = project.scope.filter(s => s.room === val).map(s => s.item);
        } else {
          const fallbackMap = {
            'Phòng ngủ': ['Tủ áo', 'Bàn trang điểm', 'Giường', 'Tủ đầu giường', 'Vách trang trí', 'Khác...'],
            'Phòng khách': ['Tủ giày', 'Vách trang trí', 'Kệ TV', 'Sofa', 'Bàn trà', 'Khác...'],
            'Phòng bếp': ['Bếp trên', 'Bếp dưới', 'Tủ đồ khô', 'Quầy bar', 'Bàn ăn', 'Khác...'],
            'Phòng thờ': ['Bàn thờ', 'Vách CNC', 'Khác...'],
            'Phòng tắm': ['Lavabo', 'Tủ gương', 'Khác...']
          };
          itemsList = fallbackMap[val] || ['Khác...'];
        }

        selectItem.innerHTML = `
          <option value="" disabled selected>-- Chọn nội thất --</option>
          ${itemsList.map(item => `<option value="${item}">${item}</option>`).join('')}
        `;
        customItem.style.display = 'none';
        customItem.required = false;
        customItem.value = '';
      }
    });

    selectItem.addEventListener('change', () => {
      if (selectItem.value === 'Khác...') {
        customItem.style.display = 'block';
        customItem.required = true;
      } else {
        customItem.style.display = 'none';
        customItem.required = false;
        customItem.value = '';
      }
    });

    const isCompletedCheckbox = row.querySelector('.chk-item-completed');
    const pendingNotesWrapper = row.querySelector('.chk-pending-notes-wrapper');
    const pendingNotesInput = row.querySelector('.txt-chk-pending-notes');
    isCompletedCheckbox.addEventListener('change', () => {
      if (isCompletedCheckbox.checked) {
        pendingNotesWrapper.style.display = 'none';
        pendingNotesInput.required = false;
        pendingNotesInput.value = '';
      } else {
        pendingNotesWrapper.style.display = 'block';
        pendingNotesInput.required = true;
      }
    });

    row.querySelector('.btn-remove-chk-item').addEventListener('click', () => {
      row.remove();
    });
  },

  // 3. RENDER WORKER VIEWS (DAILY WORK LOGS & ASSIGNED PROJECTS)
  renderWorkerView(user) {
    const body = document.getElementById('app-body-content');
    const projects = DB.getProjects();
    const db = DB.load();
    const leadWorkers = db.users.filter(u => u.role === 'lead_worker');

    const todayRecord = DB.getUserAttendanceToday(user.id);
    let assignmentBannerHtml = '';
    if (todayRecord) {
      if (todayRecord.status === 'present') {
        const prjName = todayRecord.workingProjectName || 'Chưa phân công';
        const workload = todayRecord.dailyWorkload || 'Chưa phân công khối lượng cụ thể';
        const linkAttr = todayRecord.workingProjectId ? `data-projectid="${todayRecord.workingProjectId}" style="cursor:pointer;" class="btn-goto-work-project"` : '';
        assignmentBannerHtml = `
          <div class="material-stats-card fade-in" style="background: linear-gradient(135deg, rgba(197, 168, 128, 0.12) 0%, rgba(0, 0, 0, 0.25) 100%); border: 1px solid var(--primary); border-left: 5px solid var(--primary); margin-bottom: 16px; padding: 16px; border-radius: 16px;">
            <h4 style="font-family: var(--font-title); font-size: 0.95rem; color: var(--primary); display:flex; align-items:center; gap:6px; margin-bottom: 8px;">
              <i class="fas fa-hammer"></i> CÔNG VIỆC ĐƯỢC GIAO HÔM NAY
            </h4>
            <div style="font-size: 0.85rem; color: var(--text-primary); line-height: 1.5; display:flex; flex-direction:column; gap:6px;">
              <div ${linkAttr}>
                Công trình: <strong style="text-decoration: ${todayRecord.workingProjectId ? 'underline' : 'none'}; color:var(--primary); font-weight:700;">${prjName}</strong> 
                ${todayRecord.workingProjectId ? ' <i class="fas fa-external-link-alt" style="font-size:0.7rem; opacity:0.8;"></i>' : ''}
              </div>
              <div>Nhiệm vụ thi công: <span style="font-weight: 500; color: var(--text-secondary); background:rgba(0,0,0,0.15); padding:4px 10px; border-radius:8px; display:inline-block; margin-top:2px; line-height: 1.4; border: 1px solid var(--border-color);">${workload}</span></div>
            </div>
          </div>
        `;
      } else if (todayRecord.status === 'absent') {
        assignmentBannerHtml = `
          <div class="material-stats-card fade-in" style="background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.2); border-left: 5px solid var(--status-rejected); margin-bottom: 16px; padding: 14px 16px; border-radius: 16px;">
            <div style="font-size: 0.85rem; color: var(--text-secondary); display:flex; align-items:center; gap:8px;">
              <i class="fas fa-bed" style="color:var(--status-rejected);"></i>
              <span>Hôm nay bạn được duyệt nghỉ phép 😴 ${todayRecord.note ? `(Lý do: "${todayRecord.note}")` : ''}</span>
            </div>
          </div>
        `;
      }
    } else {
      assignmentBannerHtml = '';
    }

    // Filter projects relevant to worker role
    let relevantProjects = DB.getProjectsForUser(user);

    body.innerHTML = `
      <div class="welcome-section fade-in">
        <div class="welcome-user">Chào ${user.name} 🛠️</div>
        <div class="welcome-date">${new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
      </div>

      ${user.role === 'assistant_worker' ? `
        <div class="material-stats-card fade-in" style="margin-bottom: 16px; background-color: var(--bg-secondary); padding: 14px 16px; border-radius:16px; border:1px solid var(--border-color);">
          <label class="form-label" style="margin-bottom:8px; font-weight:600; display:flex; align-items:center; gap:6px;"><i class="fas fa-people-arrows" style="color:var(--primary);"></i> Hôm nay tôi làm việc cùng Thợ chính:</label>
          <select id="worker-lead-selector" class="form-select">
            <option value="" disabled ${!DB.getSelectedLeadWorkerForAssistant(user.id) ? 'selected' : ''}>-- Chọn Thợ chính đồng hành --</option>
            ${leadWorkers.map(w => `<option value="${w.id}" ${DB.getSelectedLeadWorkerForAssistant(user.id) === w.id ? 'selected' : ''}>${w.name}</option>`).join('')}
          </select>
        </div>
      ` : ''}

      ${assignmentBannerHtml}

      <div class="stats-grid fade-in" style="display:grid; grid-template-columns: ${['kts', 'sales', 'marketing'].includes(user.role) ? '1fr 1fr 1fr' : '1fr 1fr'}; gap:12px;">
        <div class="stat-mini-card" id="stat-projects-btn" style="cursor:pointer; border-color:var(--primary); transition:all var(--transition-fast);">
          <span class="stat-mini-title" style="display:flex; justify-content:space-between; align-items:center;">
            <span>${user.role === 'assistant_worker' ? 'Công trình làm cùng' : 'Công trình phụ trách'}</span>
            <i class="fas fa-external-link-alt" style="font-size:0.7rem; color:var(--primary);"></i>
          </span>
          <span class="stat-mini-val">${relevantProjects.length}</span>
        </div>
        <div class="stat-mini-card" id="stat-pending-tasks-btn" style="cursor:pointer; border-color:var(--primary); transition:all var(--transition-fast);">
          <span class="stat-mini-title" style="display:flex; justify-content:space-between; align-items:center;">
            <span>Việc cần xử lý</span>
            <i class="fas fa-external-link-alt" style="font-size:0.7rem; color:var(--primary);"></i>
          </span>
          <span class="stat-mini-val">${relevantProjects.reduce((acc, p) => acc + p.subtasks.filter(st => st.assignedTo === user.id && st.status === 'pending').length, 0)}</span>
        </div>
        ${['kts', 'sales', 'marketing'].includes(user.role) ? `
          <div class="stat-mini-card" id="stat-completed-projects-btn" style="cursor:pointer; border-color:var(--status-approved); transition:all var(--transition-fast);">
            <span class="stat-mini-title" style="display:flex; justify-content:space-between; align-items:center;">
              <span>Công trình đã xong</span>
              <i class="fas fa-external-link-alt" style="font-size:0.7rem; color:var(--status-approved);"></i>
            </span>
            <span class="stat-mini-val">${DB.getProjects().filter(p => p.isCompleted).length}</span>
          </div>
        ` : ''}
      </div>

      <!-- Pending reports section for lead worker -->
      ${user.role === 'lead_worker' ? `
        <div class="lead-approval-section fade-in" style="margin-top: 12px; display: none;" id="lead-approval-container">
          <div class="section-header" style="margin-bottom:12px;">
            <h3 class="section-title" style="color: var(--status-pending);"><i class="fas fa-tasks"></i> Báo cáo thợ phụ chờ duyệt</h3>
          </div>
          <div id="lead-approval-list" style="display:flex; flex-direction:column; gap:12px; margin-bottom: 24px;"></div>
        </div>
      ` : ''}

      <!-- Tabs for worker daily report / edit reports -->
      <div class="tabs-container fade-in" style="display:flex; border-bottom:2px solid var(--border-color); margin-top:20px; margin-bottom:16px;">
        <button class="tab-btn active" id="tab-create-report" style="flex:1; padding:12px; font-weight:700; font-size:0.88rem; background:none; border:none; color:var(--primary); border-bottom:2px solid var(--primary); cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; outline:none;">
          <i class="fas fa-edit"></i> Báo Cáo Cuối Ngày
        </button>
        <button class="tab-btn" id="tab-edit-reports" style="flex:1; padding:12px; font-weight:700; font-size:0.88rem; background:none; border:none; color:var(--text-muted); cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; outline:none;">
          <i class="fas fa-history"></i> Lịch Sử & Sửa Báo Cáo
        </button>
      </div>

      <!-- Tab Content: Create Report -->
      <div id="tab-content-create-report" class="fade-in">
        <div class="material-stats-card" style="margin-bottom: 28px; background-color: var(--bg-secondary); padding:16px; border-radius:16px; border:1px solid var(--border-color);">
          <form id="daily-log-form" style="display:flex; flex-direction:column; gap:16px;">
            <div>
              <label class="form-label">Chọn công trình</label>
              <select id="log-project-id" class="form-select" required>
                ${relevantProjects.map(p => `<option value="${p.id}">${p.name} (GĐ ${p.step})</option>`).join('')}
                ${relevantProjects.length === 0 ? '<option value="" disabled>Không có công trình nào phù hợp</option>' : ''}
              </select>
            </div>

            ${user.role === 'assistant_worker' ? `
              <div>
                <label class="form-label">Chọn Thợ chính duyệt báo cáo hôm nay</label>
                <select id="log-approver-id" class="form-select" required>
                  ${leadWorkers.map(w => `<option value="${w.id}">${w.name}</option>`).join('')}
                  ${leadWorkers.length === 0 ? '<option value="" disabled>Không có thợ chính nào</option>' : ''}
                </select>
              </div>
            ` : ''}

            <div>
              <label class="form-label">Tình trạng tiến độ ngày hôm nay</label>
              <div style="display:flex; gap:16px; margin-top:4px;">
                <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
                  <input type="radio" name="log-status" value="on_track" checked style="accent-color:var(--status-approved); width:18px; height:18px;">
                  <span>Đúng tiến độ ✅</span>
                </label>
                <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
                  <input type="radio" name="log-status" value="delayed" style="accent-color:var(--status-rejected); width:18px; height:18px;">
                  <span>Bị chậm ⚠️</span>
                </label>
              </div>
            </div>

            ${['lead_worker', 'assistant_worker'].includes(user.role) ? `
              <!-- 3-level dynamic checklist for workers -->
              <div id="checklist-builder-container" style="display:flex; flex-direction:column; gap:12px;">
                <label class="form-label" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0;">
                  <span>Hạng mục thi công chi tiết trong ngày</span>
                  <button type="button" id="btn-add-checklist-item" class="btn-primary" style="padding:6px 12px; font-size:0.75rem; border-radius:8px; height:auto; width:auto; display:flex; align-items:center; gap:4px;">
                    <i class="fas fa-plus"></i> Thêm hạng mục
                  </button>
                </label>
                <div id="checklist-items-list" style="display:flex; flex-direction:column; gap:12px;"></div>
              </div>
            ` : `
              <div>
                <label class="form-label">Chi tiết công việc / Ghi chú lý do nếu chậm</label>
                <textarea id="log-note" class="form-textarea" placeholder="Nhập nội dung báo cáo..." required></textarea>
              </div>
            `}

            <div>
              <label class="form-label">Thời gian xong dự kiến (Ngày hoàn thành nhiệm vụ)</label>
              <input type="date" id="log-expected-completion" class="form-input" required style="padding-left:14px; height:40px;">
            </div>

            <div>
              <label class="form-label">Hình ảnh thực tế công việc (Bắt buộc tối thiểu 1 ảnh)</label>
              <div class="photo-uploader" id="log-photo-uploader">
                <i class="fas fa-camera"></i>
                <p style="font-size:0.85rem; margin-top:4px; font-weight:500;">Bấm chụp ảnh hoặc tải tệp lên</p>
                <input type="file" id="log-photo-file-input" accept="image/*" multiple style="display:none;">
              </div>
              <div class="upload-preview-container" id="log-preview-container"></div>
            </div>

            <button type="submit" class="btn-primary" style="margin-top:8px;" ${relevantProjects.length === 0 ? 'disabled' : ''}>
              <i class="fas fa-paper-plane"></i> ${user.role === 'assistant_worker' ? 'Gửi Báo Cáo Chờ Duyệt (Thợ phụ)' : 'Gửi Báo Cáo Cuối Ngày'}
            </button>
          </form>
        </div>
      </div>

      <!-- Tab Content: Edit/History Reports -->
      <div id="tab-content-edit-reports" class="fade-in" style="display:none;">
        <div id="worker-history-reports-list" style="display:flex; flex-direction:column; gap:14px; margin-bottom:28px;">
          <!-- Will be dynamically populated by renderWorkerHistoryReports -->
        </div>
      </div>
    `;

    // Bind click on assigned projects card
    const btnAssignedProjects = document.getElementById('stat-projects-btn');
    if (btnAssignedProjects) {
      btnAssignedProjects.addEventListener('click', () => {
        this.openAssignedProjectsModal(user);
      });
    }

    // Bind lead selector for assistant workers
    const leadSelector = document.getElementById('worker-lead-selector');
    if (leadSelector) {
      leadSelector.addEventListener('change', (e) => {
        const val = e.target.value;
        DB.setSelectedLeadWorkerForAssistant(user.id, val);
        const lwName = leadWorkers.find(x => x.id === val)?.name || 'Thợ chính';
        Toast.success('Đã kết nối với thợ chính: ' + lwName);
        this.renderWorkerView(user);
      });
    }

    // Bind banner link to project drawer click
    body.querySelectorAll('.btn-goto-work-project').forEach(link => {
      link.addEventListener('click', () => {
        const prjId = link.getAttribute('data-projectid');
        if (prjId) {
          this.openProjectDetailsDrawer(prjId, user, () => {
            this.renderWorkerView(user);
          });
        }
      });
    });

    // Bind click on pending tasks statistics card
    const btnPendingTasks = document.getElementById('stat-pending-tasks-btn');
    if (btnPendingTasks) {
      btnPendingTasks.addEventListener('click', () => {
        this.openPendingTasksModal(user, () => {
          this.renderWorkerView(user);
        });
      });
    }

    // Bind click on completed projects statistics card
    const btnCompletedProjects = document.getElementById('stat-completed-projects-btn');
    if (btnCompletedProjects) {
      btnCompletedProjects.addEventListener('click', () => {
        this.openEmployeeCompletedProjectsModal(user);
      });
    }

    // Dynamic Photos selector
    const previewContainer = document.getElementById('log-preview-container');
    const uploader = document.getElementById('log-photo-uploader');
    const fileInput = document.getElementById('log-photo-file-input');
    let selectedPhotos = [];

    uploader.addEventListener('click', () => {
      fileInput.click();
    });

    fileInput.addEventListener('change', async (e) => {
      const files = Array.from(e.target.files);
      if (selectedPhotos.length + files.length > 5) {
        Toast.info('Tải lên tối đa 5 hình ảnh.');
        return;
      }

      Toast.info('Đang nén và xử lý hình ảnh...');
      for (const file of files) {
        try {
          const base64Img = await this.compressImage(file);
          selectedPhotos.push(base64Img);
        } catch (err) {
          console.error(err);
          Toast.error('Không thể đọc hoặc xử lý ảnh: ' + file.name);
        }
      }
      this.updatePhotoPreviews(selectedPhotos, previewContainer);
      fileInput.value = ''; // clear value
    });

    // Pre-populate expected completion date
    const expDateInput = document.getElementById('log-expected-completion');
    if (expDateInput) {
      const d = new Date();
      d.setDate(d.getDate() + 1); // Default is always +1 day (ngày mai) for all roles
      expDateInput.value = d.toISOString().split('T')[0];
    }

    // Seed one checklist item row by default if the user is a worker, filtered by the selected project scope
    const selectLogProject = document.getElementById('log-project-id');
    const checklistList = document.getElementById('checklist-items-list');
    
    const getSelectedProject = () => {
      if (!selectLogProject || !selectLogProject.value) return null;
      return DB.getProject(selectLogProject.value);
    };

    if (checklistList) {
      const currentPrj = getSelectedProject();
      this.addChecklistItemRow(checklistList, null, currentPrj);
    }

    const btnAddChecklistItem = document.getElementById('btn-add-checklist-item');
    if (btnAddChecklistItem && checklistList) {
      btnAddChecklistItem.addEventListener('click', () => {
        const currentPrj = getSelectedProject();
        this.addChecklistItemRow(checklistList, null, currentPrj);
      });
    }

    // Reset checklist items if project selection changes
    if (selectLogProject && checklistList) {
      selectLogProject.addEventListener('change', () => {
        checklistList.innerHTML = '';
        const currentPrj = getSelectedProject();
        this.addChecklistItemRow(checklistList, null, currentPrj);
      });
    }

    // Form Submit Daily Log
    document.getElementById('daily-log-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const prjId = document.getElementById('log-project-id').value;
      const status = document.querySelector('input[name="log-status"]:checked').value;
      const expectedDate = document.getElementById('log-expected-completion').value;

      let note = '';
      let items = [];

      const isWorker = ['lead_worker', 'assistant_worker'].includes(user.role);
      if (isWorker) {
        const rows = document.querySelectorAll('.checklist-item-row');
        if (rows.length === 0) {
          Toast.error('Vui lòng thêm ít nhất 1 hạng mục báo cáo.');
          return;
        }

        let hasError = false;
        rows.forEach(row => {
          const selectRoom = row.querySelector('.select-chk-room').value;
          const customRoom = row.querySelector('.txt-chk-custom-room').value;
          const room = selectRoom === 'Khác...' ? customRoom.trim() : selectRoom;

          const selectItem = row.querySelector('.select-chk-item').value;
          const customItem = row.querySelector('.txt-chk-custom-item').value;
          const item = selectItem === 'Khác...' ? customItem.trim() : selectItem;

          const isCompleted = row.querySelector('.chk-item-completed').checked;
          const pendingNotes = row.querySelector('.txt-chk-pending-notes').value.trim();

          if (!room || !item) {
            hasError = true;
          }

          items.push({
            room,
            item,
            isCompleted,
            pendingNotes: isCompleted ? '' : pendingNotes
          });
        });

        if (hasError) {
          Toast.error('Vui lòng nhập đầy đủ thông tin phòng và nội thất.');
          return;
        }

        // Generate text note summary for old compatibility
        note = items.map(it => {
          return `[${it.room} - ${it.item}]: ${it.isCompleted ? 'Đã xong ✅' : `Chưa xong (Cần làm: ${it.pendingNotes}) ⚠️`}`;
        }).join('\n');

      } else {
        note = document.getElementById('log-note').value;
      }

      try {
        if (!prjId) throw new Error('Vui lòng chọn công trình.');
        const approverEl = document.getElementById('log-approver-id');
        const approverId = approverEl ? approverEl.value : '';
        DB.submitDailyLog(prjId, status, note, selectedPhotos, user.id, expectedDate, items, approverId);
        const prj = DB.getProject(prjId);
        if (user.role === 'assistant_worker' && prj && prj.step === 3) {
          Toast.success('Đã gửi báo cáo chờ thợ chính phê duyệt.');
        } else if (user.role === 'assistant_worker') {
          Toast.success('Đã gửi báo cáo thi công tại xưởng thành công! (Không cần duyệt)');
        } else {
          Toast.success('Gửi báo cáo cuối ngày thành công!');
        }
        this.renderWorkerView(user); // refresh everything
      } catch (err) {
        Toast.error(err.message);
      }
    });

    // Helper function to render worker history reports
    const renderWorkerHistoryReports = () => {
      const historyListContainer = document.getElementById('worker-history-reports-list');
      if (!historyListContainer) return;

      const myLogs = [];
      const db = DB.load();
      db.projects.forEach(p => {
        if (p.dailyLogs) {
          p.dailyLogs.forEach(l => {
            if (l.reporterId === user.id) {
              myLogs.push({ project: p, log: l });
            }
          });
        }
      });

      myLogs.sort((a, b) => b.log.date.localeCompare(a.log.date));

      if (myLogs.length === 0) {
        historyListContainer.innerHTML = `
          <div style="text-align:center; padding: 32px; color:var(--text-muted); background-color:var(--bg-secondary); border-radius:20px; border:1px solid var(--border-color)">
            <i class="fas fa-history" style="font-size:2rem; margin-bottom:8px;"></i>
            <p style="font-size:0.85rem;">Bạn chưa gửi báo cáo nào.</p>
          </div>
        `;
        return;
      }

      historyListContainer.innerHTML = myLogs.map(item => {
        const p = item.project;
        const l = item.log;
        const isApproved = l.approved !== false;
        
        return `
          <div class="material-stats-card" style="border-left: 4px solid ${l.status === 'on_track' ? 'var(--status-approved)' : 'var(--status-rejected)'}; padding: 14px 16px; background-color:var(--bg-secondary); display:flex; flex-direction:column; gap:8px; border-radius:16px; border:1px solid var(--border-color);">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
              <div>
                <h5 style="font-weight: 700; font-size: 0.92rem; color: var(--text-primary); margin-bottom: 2px;">${p.name}</h5>
                <p style="font-size: 0.76rem; color: var(--text-secondary);">
                  Ngày báo cáo: <strong>${l.date}</strong> | Trạng thái: ${isApproved ? '<span style="color:var(--status-approved);">Đã duyệt ✅</span>' : '<span style="color:var(--status-pending);">Chờ duyệt ⏳</span>'}
                </p>
              </div>
              <span class="status-badge ${l.status === 'on_track' ? 'approved' : 'rejected'}" style="font-size: 0.7rem; font-weight: 700; padding: 3px 8px; border-radius: 6px; white-space:nowrap;">
                ${l.status === 'on_track' ? 'Đúng tiến độ' : 'Bị chậm'}
              </span>
            </div>
            
            <div style="font-size: 0.8rem; color: var(--text-secondary); background: rgba(0,0,0,0.1); border: 1px solid var(--border-color); border-radius: 8px; padding: 8px 12px; white-space: pre-wrap; margin: 4px 0;">${l.note}</div>
            
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top: 4px; flex-wrap:wrap; gap:8px;">
              <span style="font-size: 0.72rem; color: var(--text-muted);">
                <i class="fas fa-camera"></i> ${l.photos ? l.photos.length : 0} ảnh | <i class="fas fa-calendar-alt"></i> Dự kiến xong: ${l.expectedCompletionDate ? new Date(l.expectedCompletionDate).toLocaleDateString('vi-VN') : 'Chưa đặt'}
              </span>
              <div style="display:flex; gap:6px;">
                <button type="button" class="btn-action btn-edit-my-log" data-projectid="${p.id}" data-logid="${l.id}" style="padding: 6px 12px; font-size: 0.75rem; background:linear-gradient(135deg, var(--primary), #9E815B); color:var(--bg-primary); border:none; border-radius: 8px; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:4px; height:auto; line-height:1.2;">
                  <i class="fas fa-edit"></i> Sửa
                </button>
                <button type="button" class="btn-action btn-delete-my-log" data-projectid="${p.id}" data-logid="${l.id}" style="padding: 6px 12px; font-size: 0.75rem; background:linear-gradient(135deg, var(--status-rejected), #B91C1C); color:white; border:none; border-radius: 8px; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:4px; height:auto; line-height:1.2;">
                  <i class="fas fa-trash-alt"></i> Xóa
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('');

      // Bind events for Edit/Delete buttons
      historyListContainer.querySelectorAll('.btn-edit-my-log').forEach(btn => {
        btn.addEventListener('click', () => {
          const prjId = btn.getAttribute('data-projectid');
          const logId = btn.getAttribute('data-logid');
          const prj = DB.getProject(prjId);
          const logItem = prj ? prj.dailyLogs.find(x => x.id === logId) : null;
          if (prj && logItem) {
            this.openEditLogModal(prj, logItem, user, () => {
              renderWorkerHistoryReports();
            });
          }
        });
      });

      historyListContainer.querySelectorAll('.btn-delete-my-log').forEach(btn => {
        btn.addEventListener('click', () => {
          const prjId = btn.getAttribute('data-projectid');
          const logId = btn.getAttribute('data-logid');
          if (confirm('Bạn có chắc chắn muốn xóa báo cáo này?')) {
            const success = DB.deleteDailyLog(prjId, logId, user.id);
            if (success) {
              Toast.success('Đã xóa báo cáo.');
              renderWorkerHistoryReports();
            } else {
              Toast.error('Không thể xóa báo cáo.');
            }
          }
        });
      });
    };

    // Tab switching event binding
    const tabCreate = document.getElementById('tab-create-report');
    const tabEdit = document.getElementById('tab-edit-reports');
    const contentCreate = document.getElementById('tab-content-create-report');
    const contentEdit = document.getElementById('tab-content-edit-reports');

    if (tabCreate && tabEdit && contentCreate && contentEdit) {
      tabCreate.addEventListener('click', () => {
        tabCreate.classList.add('active');
        tabCreate.style.color = 'var(--primary)';
        tabCreate.style.borderBottom = '2px solid var(--primary)';
        
        tabEdit.classList.remove('active');
        tabEdit.style.color = 'var(--text-muted)';
        tabEdit.style.borderBottom = 'none';
        
        contentCreate.style.display = 'block';
        contentEdit.style.display = 'none';
      });

      tabEdit.addEventListener('click', () => {
        tabEdit.classList.add('active');
        tabEdit.style.color = 'var(--primary)';
        tabEdit.style.borderBottom = '2px solid var(--primary)';
        
        tabCreate.classList.remove('active');
        tabCreate.style.color = 'var(--text-muted)';
        tabCreate.style.borderBottom = 'none';
        
        contentCreate.style.display = 'none';
        contentEdit.style.display = 'block';
        
        renderWorkerHistoryReports();
      });
    }

    // Populate pending logs list for lead worker review
    if (user.role === 'lead_worker') {
      const approvalContainer = document.getElementById('lead-approval-container');
      const approvalList = document.getElementById('lead-approval-list');
      if (approvalContainer && approvalList) {
        const pendingItems = [];
        relevantProjects.forEach(p => {
          p.dailyLogs.forEach(l => {
            if (l.approved === false && (!l.approverId || l.approverId === user.id)) {
              pendingItems.push({ project: p, log: l });
            }
          });
        });

        if (pendingItems.length > 0) {
          approvalContainer.style.display = 'block';
          approvalList.innerHTML = pendingItems.map(item => {
            const numPhotos = item.log.photos ? item.log.photos.length : 0;
            return `
              <div class="material-stats-card" style="border-left: 4px solid var(--status-pending); display: flex; flex-direction: column; gap: 8px; padding: 14px 16px; background: rgba(255, 255, 255, 0.01);">
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                  <div>
                    <h5 style="font-weight: 700; font-size: 0.92rem; color: var(--text-primary); margin-bottom: 2px;">${item.project.name}</h5>
                    <p style="font-size: 0.76rem; color: var(--text-secondary);">
                      Người gửi: <strong>${item.log.reporterName}</strong> (Thợ phụ) | Ngày: ${item.log.date}
                    </p>
                  </div>
                  <span class="status-badge" style="font-size: 0.7rem; font-weight: 700; background: rgba(210, 144, 98, 0.12); color: var(--status-pending); padding: 3px 8px; border-radius: 6px;">
                    Chờ duyệt
                  </span>
                </div>
                <div style="font-size: 0.8rem; color: var(--text-secondary); background: rgba(0,0,0,0.1); border: 1px solid var(--border-color); border-radius: 8px; padding: 8px 12px; white-space: pre-wrap; margin: 4px 0;">${item.log.note}</div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top: 4px;">
                  <span style="font-size: 0.72rem; color: var(--text-muted);">
                    <i class="fas fa-camera"></i> ${numPhotos} ảnh | <i class="fas fa-calendar-alt"></i> Hạn: ${item.log.expectedCompletionDate ? new Date(item.log.expectedCompletionDate).toLocaleDateString('vi-VN') : 'Chưa đặt'}
                  </span>
                  <button type="button" class="btn-primary btn-lead-review" data-projectid="${item.project.id}" data-logid="${item.log.id}" style="padding: 6px 12px; font-size: 0.78rem; border-radius: 8px; height: auto; width: auto; display:flex; align-items:center; gap:4px;">
                    <i class="fas fa-edit"></i> Sửa & Duyệt
                  </button>
                </div>
              </div>
            `;
          }).join('');

          // Bind review click actions
          approvalList.querySelectorAll('.btn-lead-review').forEach(btn => {
            btn.addEventListener('click', () => {
              const pId = btn.getAttribute('data-projectid');
              const lId = btn.getAttribute('data-logid');
              this.openLeadReviewModal(pId, lId, user, () => {
                this.renderWorkerView(user);
              });
            });
          });
        } else {
          approvalContainer.style.display = 'none';
        }
      }
    }
  },

  // 3.1 OPEN LEAD WORKER REVIEW MODAL
  openLeadReviewModal(projectId, logId, leadUser, onComplete) {
    const project = DB.getProject(projectId);
    if (!project) return;
    const log = project.dailyLogs.find(l => l.id === logId);
    if (!log) return;

    const html = `
      <form id="lead-review-form" style="display:flex; flex-direction:column; gap:16px; max-height: 80vh; overflow-y: auto; padding: 4px;">
        <div style="border-bottom:1px solid var(--border-color); padding-bottom:8px;">
          <h4 style="font-family:var(--font-title); font-size:1rem; color:var(--text-primary);">${project.name}</h4>
          <p style="font-size:0.75rem; color:var(--text-secondary); margin-top:2px;">
            Báo cáo gửi bởi: <strong>${log.reporterName}</strong> | Ngày: ${log.date}
          </p>
        </div>

        <div>
          <label class="form-label">Tình trạng tiến độ</label>
          <div style="display:flex; gap:16px; margin-top:4px;">
            <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
              <input type="radio" name="review-status" value="on_track" ${log.status === 'on_track' ? 'checked' : ''} style="accent-color:var(--status-approved); width:18px; height:18px;">
              <span>Đúng tiến độ ✅</span>
            </label>
            <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
              <input type="radio" name="review-status" value="delayed" ${log.status === 'delayed' ? 'checked' : ''} style="accent-color:var(--status-rejected); width:18px; height:18px;">
              <span>Bị chậm ⚠️</span>
            </label>
          </div>
        </div>

        <!-- 3-level dynamic checklist -->
        <div id="review-checklist-container" style="display:flex; flex-direction:column; gap:12px;">
          <label class="form-label" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0;">
            <span>Chi tiết hạng mục lắp ráp</span>
            <button type="button" id="btn-review-add-item" class="btn-primary" style="padding:6px 12px; font-size:0.75rem; border-radius:8px; height:auto; width:auto; display:flex; align-items:center; gap:4px;">
              <i class="fas fa-plus"></i> Thêm hạng mục
            </button>
          </label>
          <div id="review-checklist-list" style="display:flex; flex-direction:column; gap:12px;"></div>
        </div>

        <div>
          <label class="form-label">Thời gian xong dự kiến</label>
          <input type="date" id="review-expected-completion" class="form-input" required style="padding-left:14px; height:40px;" value="${log.expectedCompletionDate || ''}">
        </div>

        <div>
          <label class="form-label">Hình ảnh thực tế đính kèm (Bắt buộc tối thiểu 1 ảnh)</label>
          <div class="photo-uploader" id="review-photo-uploader">
            <i class="fas fa-camera"></i>
            <p style="font-size:0.85rem; margin-top:4px; font-weight:500;">Bấm để thêm ảnh mới</p>
            <input type="file" id="review-photo-file-input" accept="image/*" multiple style="display:none;">
          </div>
          <div class="upload-preview-container" id="review-preview-container"></div>
        </div>

        <div style="display:flex; gap:12px; margin-top:12px;">
          <button type="button" class="btn-secondary modal-close-btn" style="flex:1;">Hủy bỏ</button>
          <button type="submit" class="btn-primary" style="flex:2;">
            <i class="fas fa-check-circle"></i> Phê Duyệt & Gửi
          </button>
        </div>
      </form>
    `;

    const modal = Modal.create('Sửa & Duyệt Báo Cáo', html);

    // Seed checklist rows from log.items, passing project scope context
    const checklistList = document.getElementById('review-checklist-list');
    if (checklistList) {
      if (log.items && log.items.length > 0) {
        log.items.forEach(it => {
          this.addChecklistItemRow(checklistList, it, project);
        });
      } else {
        this.addChecklistItemRow(checklistList, null, project);
      }
    }

    const btnAddReviewItem = document.getElementById('btn-review-add-item');
    if (btnAddReviewItem && checklistList) {
      btnAddReviewItem.addEventListener('click', () => {
        this.addChecklistItemRow(checklistList, null, project);
      });
    }

    // Photo preview bindings
    const previewContainer = document.getElementById('review-preview-container');
    const uploader = document.getElementById('review-photo-uploader');
    const fileInput = document.getElementById('review-photo-file-input');
    let selectedPhotos = [...(log.photos || [])];

    this.updatePhotoPreviews(selectedPhotos, previewContainer);

    uploader.addEventListener('click', () => {
      fileInput.click();
    });

    fileInput.addEventListener('change', async (e) => {
      const files = Array.from(e.target.files);
      if (selectedPhotos.length + files.length > 5) {
        Toast.info('Tải lên tối đa 5 hình ảnh.');
        return;
      }

      Toast.info('Đang nén và xử lý hình ảnh...');
      for (const file of files) {
        try {
          const base64Img = await this.compressImage(file);
          selectedPhotos.push(base64Img);
        } catch (err) {
          console.error(err);
          Toast.error('Không thể đọc hoặc xử lý ảnh: ' + file.name);
        }
      }
      this.updatePhotoPreviews(selectedPhotos, previewContainer);
      fileInput.value = '';
    });

    // Handle photo removal in modal preview container
    previewContainer.addEventListener('click', (e) => {
      const removeBtn = e.target.closest('.upload-preview-remove');
      if (removeBtn) {
        const index = parseInt(removeBtn.getAttribute('data-index'));
        selectedPhotos.splice(index, 1);
        this.updatePhotoPreviews(selectedPhotos, previewContainer);
      }
    });

    // Form submit
    document.getElementById('lead-review-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const status = document.querySelector('input[name="review-status"]:checked').value;
      const expectedDate = document.getElementById('review-expected-completion').value;

      const rows = document.querySelectorAll('#review-checklist-list .checklist-item-row');
      if (rows.length === 0) {
        Toast.error('Vui lòng thêm ít nhất 1 hạng mục báo cáo.');
        return;
      }

      let items = [];
      let hasError = false;
      rows.forEach(row => {
        const selectRoom = row.querySelector('.select-chk-room').value;
        const customRoom = row.querySelector('.txt-chk-custom-room').value;
        const room = selectRoom === 'Khác...' ? customRoom.trim() : selectRoom;

        const selectItem = row.querySelector('.select-chk-item').value;
        const customItem = row.querySelector('.txt-chk-custom-item').value;
        const item = selectItem === 'Khác...' ? customItem.trim() : selectItem;

        const isCompleted = row.querySelector('.chk-item-completed').checked;
        const pendingNotes = row.querySelector('.txt-chk-pending-notes').value.trim();

        if (!room || !item) {
          hasError = true;
        }

        items.push({
          room,
          item,
          isCompleted,
          pendingNotes: isCompleted ? '' : pendingNotes
        });
      });

      if (hasError) {
        Toast.error('Vui lòng điền đầy đủ thông tin phòng và nội thất.');
        return;
      }

      if (selectedPhotos.length === 0) {
        Toast.error('Vui lòng đính kèm ít nhất 1 hình ảnh thực tế.');
        return;
      }

      const note = items.map(it => {
        return `[${it.room} - ${it.item}]: ${it.isCompleted ? 'Đã xong ✅' : `Chưa xong (Cần làm: ${it.pendingNotes}) ⚠️`}`;
      }).join('\n');

      try {
        DB.approveDailyLog(projectId, logId, status, note, expectedDate, items, selectedPhotos, leadUser.id);
        Toast.success('Phê duyệt báo cáo thành công!');
        modal.close();
        onComplete();
      } catch (err) {
        Toast.error(err.message);
      }
    });

    modal.element.querySelectorAll('.modal-close-btn').forEach(btn => {
      btn.addEventListener('click', () => modal.close());
    });
  },

  // 3.3 COMPRESS AND CONVERT IMAGE FILE TO BASE64
  async compressImage(file, maxWidth = 800, maxHeight = 800, quality = 0.6) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = (err) => reject(err);
      reader.onload = (e) => {
        const img = new Image();
        img.onerror = (err) => reject(err);
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  },

  updatePhotoPreviews(photos, container) {
    container.innerHTML = photos.map((url, index) => `
      <div class="upload-preview-item">
        <img src="${url}">
        <button type="button" class="upload-preview-remove" data-index="${index}">&times;</button>
      </div>
    `).join('');

    // Attach removes
    container.querySelectorAll('.upload-preview-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const index = parseInt(btn.getAttribute('data-index'));
        photos.splice(index, 1);
        this.updatePhotoPreviews(photos, container);
      });
    });
  },

  renderWorkerProjects(projects, user, listContainer = document.getElementById('modal-project-list-container'), onUpdate = null) {
    if (!listContainer) return;
    const isManagementRole = ['manager', 'kts', 'sales', 'marketing'].includes(user.role);

    if (projects.length === 0) {
      listContainer.innerHTML = `
        <div style="text-align:center; padding: 32px; color:var(--text-muted); background-color:var(--bg-secondary); border-radius:20px; border:1px solid var(--border-color)">
          <i class="fas fa-folder-open" style="font-size:2rem; margin-bottom:8px;"></i>
          <p>Hiện tại bạn không phụ trách công trình nào.</p>
        </div>
      `;
      return;
    }

    listContainer.innerHTML = projects.map(p => {
      const stepInfo = STEPS.find(s => s.num === p.step) || STEPS[0];
      const pendingSubtasks = p.subtasks.filter(st => st.status === 'pending');
      const mySubtasks = p.subtasks.filter(st => {
        const isAssignedToMe = st.assignedTo === user.id;
        const isUnassignedTask = (!st.assignedTo || st.assignedTo === '') && (st.type === 'rework' || st.type === 'small_scope');
        return isAssignedToMe || ((user.role === 'kts' || user.role === 'sales') && isUnassignedTask);
      });

      // Check deadline
      const isOverdue = new Date(p.deadline) < new Date() && p.step < 4;

      return `
        <div class="report-card" style="border-left: 1px solid var(--border-color);">
          <div class="report-card-header">
            <div>
              <div class="report-project">${p.name}</div>
              <div class="report-time">
                Hạn hoàn thành: <span style="font-weight:700; font-size:0.75rem; padding:2px 8px; border-radius:6px; background-color:${isOverdue ? 'rgba(201, 91, 91, 0.15)' : 'rgba(197, 168, 128, 0.12)'}; border:1px solid ${isOverdue ? 'rgba(201, 91, 91, 0.3)' : 'rgba(197, 168, 128, 0.3)'}; color:${isOverdue ? 'var(--status-rejected)' : 'var(--primary)'};">${p.deadline}${isOverdue ? ' [TRỄ]' : ''}</span>
                ${p.isSmallScope ? ' <span class="status-badge" style="background-color:rgba(210, 144, 98, 0.15); color:var(--status-pending); font-size:0.7rem; padding: 2px 6px;">[PHÁT SINH NHỎ]</span>' : ''}
              </div>
            </div>
            <div style="text-align:right;">
              <span class="status-badge approved" style="font-weight: 700;">
                <i class="fas ${stepInfo.icon}"></i> GĐ ${p.step}/4
              </span>
              <div style="font-size:0.75rem; font-weight:600; color:var(--text-muted); margin-top:4px;">${stepInfo.title}</div>
            </div>
          </div>

          <div style="display:flex; flex-wrap:wrap; gap:8px;">
            ${p.isRework ? '<span class="status-badge rejected" style="font-weight:700;"><i class="fas fa-exclamation-triangle"></i> [SỬA HÀNG LỖI]</span>' : ''}
          </div>

          <div class="report-content" style="font-size:0.85rem;">
            <strong>Mô tả giai đoạn:</strong> ${stepInfo.desc}
          </div>

          <!-- Subtasks assigned to this user -->
          ${mySubtasks.length > 0 ? `
            <div style="background-color: var(--bg-primary); border:1px solid var(--border-color); border-radius:12px; padding:12px;">
              <p style="font-size:0.8rem; font-weight:600; color:var(--primary); margin-bottom:10px;"><i class="fas fa-tasks"></i> ${(user.role === 'kts' || user.role === 'sales') ? 'Nhiệm vụ cần phân công & xử lý:' : 'Nhiệm vụ của bạn:'}</p>
              <div style="display:flex; flex-direction:column; gap:10px;">
                ${mySubtasks.map(st => {
                  const compTimeText = st.status === 'completed' && st.completedAt
                    ? `<div style="font-size:0.7rem; color:var(--status-approved); font-weight:500; margin-top:2px;"><i class="fas fa-clock"></i> Xong lúc: ${new Date(st.completedAt).toLocaleTimeString('vi-VN')} - ${new Date(st.completedAt).toLocaleDateString('vi-VN')}</div>`
                    : '';
                  return `
                    <div style="background-color:var(--bg-secondary); border:1px solid var(--border-color); border-radius:10px; padding:10px 12px; display:flex; justify-content:space-between; align-items:center; gap:12px; box-shadow:var(--shadow-sm); width:100%; box-sizing:border-box;">
                      <div style="flex:1; display:flex; flex-direction:column;">
                        <span style="font-size:0.82rem; font-weight:600; text-decoration: ${st.status === 'completed' ? 'line-through' : 'none'}; color: ${st.status === 'completed' ? 'var(--text-muted)' : 'var(--text-primary)'}; line-height:1.4;">
                          ${st.type === 'rework' ? '<strong style="color:var(--status-rejected)">[LỖI]</strong> ' : ''}
                          ${st.type === 'small_scope' ? '<strong style="color:var(--status-pending)">[PHÁT SINH]</strong> ' : ''}
                          ${st.title}
                        </span>
                        ${compTimeText}
                      </div>
                      <div style="display:flex; align-items:center; gap:8px;">
                        ${st.status === 'pending'
                          ? ((user.role === 'kts' || user.role === 'sales') && !st.assignedTo
                            ? `<button class="btn-assign-existing-task" data-project="${p.id}" data-task="${st.id}" style="background:linear-gradient(135deg, var(--primary), #9E815B); color:var(--bg-primary); border:none; padding:6px 12px; border-radius:6px; font-size:0.75rem; font-weight:700; cursor:pointer;">Giao việc</button>`
                            : `<button class="btn-complete-subtask" data-project="${p.id}" data-task="${st.id}" style="background-color:rgba(78, 141, 124, 0.12); border:1px solid rgba(78,141,124,0.25); color:var(--status-approved); border-radius:6px; padding:6px 12px; font-size:0.75rem; font-weight:700; cursor:pointer; height:auto; margin-right:4px;">Xong</button>`)
                          : '<span style="color:var(--status-approved); font-weight:700; font-size:0.75rem; white-space:nowrap; margin-right:4px;"><i class="fas fa-check-double"></i> Đã xong</span>'
                        }
                        ${(user.role === 'kts' || user.role === 'sales') && !p.isCompleted ? `
                          <button class="btn-card-edit-subtask" data-project="${p.id}" data-task="${st.id}" style="background:none; border:none; padding:4px; color:var(--primary); cursor:pointer;" title="Sửa nhiệm vụ"><i class="fas fa-edit"></i></button>
                          <button class="btn-card-delete-subtask" data-project="${p.id}" data-task="${st.id}" style="background:none; border:none; padding:4px; color:var(--status-rejected); cursor:pointer;" title="Xóa nhiệm vụ"><i class="fas fa-trash-alt"></i></button>
                        ` : ''}
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Actions Board for project progression -->
          <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:8px; margin-top:12px;">
            
            <!-- Advance step -->
            ${isManagementRole ? `
              <button class="btn-advance-step btn-action" data-project="${p.id}" 
                style="background: ${(p.isRework && pendingSubtasks.some(st => st.type === 'rework')) ? '#333' : 'linear-gradient(135deg, #4F46E5, #4338CA)'}; color:white; border:none; font-weight:700; grid-column: span 2;"
                ${(p.isRework && pendingSubtasks.some(st => st.type === 'rework')) || p.step >= 4 ? 'disabled' : ''}>
                <i class="fas fa-arrow-circle-right"></i> Qua Giai Đoạn Tiếp Theo
              </button>
            ` : ''}

            <!-- Rework -->
            <button class="btn-rework-modal btn-action" data-project="${p.id}" style="background:linear-gradient(135deg, #EF4444, #B91C1C); color:white; border:none; font-weight:700; grid-column: span 1;">
              <i class="fas fa-exclamation-triangle"></i> Báo Hàng Lỗi
            </button>

            <!-- Add Scope -->
            <button class="btn-scope-modal btn-action" data-project="${p.id}" style="background:linear-gradient(135deg, #F59E0B, #D97706); color:white; border:none; font-weight:700; grid-column: span 1;">
              <i class="fas fa-plus"></i> Phát Sinh Thêm
            </button>

            <!-- KTS/Sales Assign Task to Worker -->
            ${(user.role === 'kts' || user.role === 'sales') ? `
              <button class="btn-assign-subtask-modal btn-action" data-project="${p.id}" style="grid-column: span 2; background: linear-gradient(135deg, var(--primary), #9E815B); color: var(--bg-primary); border: none; font-weight: 700; box-shadow: var(--shadow-sm);">
                <i class="fas fa-tasks"></i> GIAO VIỆC CHO THỢ
              </button>
            ` : ''}

          </div>
        </div>
      `;
    }).join('');

    // Event Handlers for Worker Projects List
    listContainer.querySelectorAll('.btn-complete-subtask').forEach(btn => {
      btn.addEventListener('click', () => {
        const prjId = btn.getAttribute('data-project');
        const stId = btn.getAttribute('data-task');
        DB.completeSubtask(prjId, stId, user.id);
        Toast.success('Đã đánh dấu hoàn thành nhiệm vụ!');
        if (onUpdate) onUpdate(); else this.renderWorkerView(user);
      });
    });

    listContainer.querySelectorAll('.btn-assign-existing-task').forEach(btn => {
      btn.addEventListener('click', () => {
        const prjId = btn.getAttribute('data-project');
        const stId = btn.getAttribute('data-task');
        this.openAssignExistingTaskModal(prjId, stId, () => {
          if (onUpdate) onUpdate(); else this.renderWorkerView(user);
        });
      });
    });

    listContainer.querySelectorAll('.btn-card-edit-subtask').forEach(btn => {
      btn.addEventListener('click', () => {
        const prjId = btn.getAttribute('data-project');
        const stId = btn.getAttribute('data-task');
        this.openEditSubtaskModal(prjId, stId, user, () => {
          if (onUpdate) onUpdate(); else this.renderWorkerView(user);
        });
      });
    });

    listContainer.querySelectorAll('.btn-card-delete-subtask').forEach(btn => {
      btn.addEventListener('click', () => {
        const prjId = btn.getAttribute('data-project');
        const stId = btn.getAttribute('data-task');
        if (confirm('Bạn có chắc chắn muốn xóa nhiệm vụ này?')) {
          DB.deleteSubtask(prjId, stId, user.id);
          Toast.success('Đã xóa nhiệm vụ.');
          if (onUpdate) onUpdate(); else this.renderWorkerView(user);
        }
      });
    });

    listContainer.querySelectorAll('.btn-advance-step').forEach(btn => {
      btn.addEventListener('click', () => {
        const prjId = btn.getAttribute('data-project');
        try {
          const prj = DB.advanceProject(prjId, user.id);
          if (prj) {
            Toast.success(`Chúc mừng! Công trình đã sang giai đoạn ${prj.step}: ${STEPS.find(s => s.num === prj.step).title}`);
            if (onUpdate) onUpdate(); else this.renderWorkerView(user);
          }
        } catch (err) {
          Toast.error(err.message);
        }
      });
    });

    listContainer.querySelectorAll('.btn-rework-modal').forEach(btn => {
      btn.addEventListener('click', () => {
        const prjId = btn.getAttribute('data-project');
        this.openReworkModal(prjId, user, onUpdate);
      });
    });

    listContainer.querySelectorAll('.btn-scope-modal').forEach(btn => {
      btn.addEventListener('click', () => {
        const prjId = btn.getAttribute('data-project');
        this.openScopeModal(prjId, user, onUpdate);
      });
    });

    listContainer.querySelectorAll('.btn-assign-subtask-modal').forEach(btn => {
      btn.addEventListener('click', () => {
        const prjId = btn.getAttribute('data-project');
        this.openAssignTaskModal(prjId, user, () => {
          if (onUpdate) onUpdate(); else this.renderWorkerView(user);
        });
      });
    });
  },

  // 3.1 OPEN PENDING SUBTASKS LIST MODAL FOR WORKER
  openPendingTasksModal(user, onComplete) {
    const projects = DB.getProjects();

    // Aggregate all pending subtasks assigned to this user OR unassigned for KTS/Sales
    let myPendingTasks = [];
    projects.forEach(p => {
      p.subtasks.forEach(st => {
        if (st.status === 'pending') {
          const isAssignedToMe = st.assignedTo === user.id;
          const isUnassignedTask = (!st.assignedTo || st.assignedTo === '') && (st.type === 'rework' || st.type === 'small_scope');
          if (isAssignedToMe || ((user.role === 'kts' || user.role === 'sales') && isUnassignedTask)) {
            myPendingTasks.push({
              ...st,
              projectId: p.id,
              projectName: p.name
            });
          }
        }
      });
    });

    const html = `
      <div style="display:flex; flex-direction:column; gap:16px;">
        <div style="border-bottom:1px solid var(--border-color); padding-bottom:10px;">
          <h4 style="font-family:var(--font-title); font-size:1.1rem; color:var(--text-primary);">${(user.role === 'kts' || user.role === 'sales') ? 'Nhiệm Vụ Phân Công & Xử Lý' : 'Việc Cần Xử Lý Của Bạn'}</h4>
          <p style="font-size:0.78rem; color:var(--text-secondary); margin-top:2px;">Tổng số việc chưa làm: <strong>${myPendingTasks.length} việc</strong></p>
        </div>

        <div style="display:flex; flex-direction:column; gap:12px; max-height:360px; overflow-y:auto; padding-right:4px;">
          ${myPendingTasks.map(st => {
            let badgeHtml = '';
            if (st.type === 'rework') {
              badgeHtml = `<span class="status-badge rejected" style="font-size:0.65rem; font-weight:700; padding:2px 6px; border-radius:4px; margin-right:4px;">[SỬA LỖI]</span>`;
            } else if (st.type === 'small_scope') {
              badgeHtml = `<span class="status-badge pending" style="background-color:rgba(210, 144, 98, 0.15); color:var(--status-pending); font-size:0.65rem; font-weight:700; padding:2px 6px; border-radius:4px; margin-right:4px;">[PHÁT SINH]</span>`;
            }

            return `
              <div style="background-color:var(--bg-secondary); border:1px solid var(--border-color); border-radius:16px; padding:14px; display:flex; justify-content:space-between; align-items:center; gap:12px; box-shadow:var(--shadow-sm);">
                <div style="flex:1;">
                  <div style="font-size:0.88rem; font-weight:600; color:var(--text-primary); display:flex; align-items:center; flex-wrap:wrap; gap:4px; line-height:1.4;">
                    ${badgeHtml}
                    <span>${st.title}</span>
                  </div>
                  <div style="font-size:0.75rem; color:var(--primary); margin-top:6px; font-weight:600;">
                    <i class="fas fa-building" style="margin-right:2px;"></i> ${st.projectName}
                  </div>
                </div>
                ${!st.assignedTo
                  ? `<button class="btn-modal-assign-task btn-action" data-project="${st.projectId}" data-task="${st.id}" style="background:linear-gradient(135deg, var(--primary), #9E815B); color:var(--bg-primary); padding:10px 14px; border-radius:10px; font-size:0.8rem; font-weight:700; height:auto; cursor:pointer;"><i class="fas fa-user-plus"></i> Giao việc</button>`
                  : `<button class="btn-modal-complete-task btn-action" data-project="${st.projectId}" data-task="${st.id}" style="background-color:rgba(78, 141, 124, 0.12); border:1px solid rgba(78,141,124,0.25); color:var(--status-approved); padding:10px 14px; border-radius:10px; font-size:0.8rem; height:auto; cursor:pointer;"><i class="fas fa-check-circle"></i> Xong</button>`
                }
              </div>
            `;
          }).join('')}
          ${myPendingTasks.length === 0 ? `
            <div style="text-align:center; padding:32px 16px; color:var(--text-muted);">
              <i class="fas fa-smile-beam" style="font-size:2rem; color:var(--status-approved); margin-bottom:8px;"></i>
              <p style="font-size:0.85rem;">Tuyệt vời! Bạn không còn việc nào cần xử lý.</p>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    const modal = Modal.create('Việc Cần Xử Lý', html);

    // Bind complete button clicks
    modal.element.querySelectorAll('.btn-modal-complete-task').forEach(btn => {
      btn.addEventListener('click', () => {
        const prjId = btn.getAttribute('data-project');
        const taskId = btn.getAttribute('data-task');
        DB.completeSubtask(prjId, taskId, user.id);
        Toast.success('Đã hoàn thành nhiệm vụ!');
        modal.close();
        onComplete();
      });
    });

    // Bind assign button clicks
    modal.element.querySelectorAll('.btn-modal-assign-task').forEach(btn => {
      btn.addEventListener('click', () => {
        const prjId = btn.getAttribute('data-project');
        const taskId = btn.getAttribute('data-task');
        modal.close();
        this.openAssignExistingTaskModal(prjId, taskId, onComplete);
      });
    });
  },

  // 3.2 OPEN ASSIGNED PROJECTS LIST MODAL FOR WORKER
  openAssignedProjectsModal(user) {
    const refreshModal = () => {
      let relevantProjects = DB.getProjectsForUser(user);

      const listContainer = document.getElementById('modal-project-list-container');
      if (listContainer) {
        this.renderWorkerProjects(relevantProjects, user, listContainer, () => {
          refreshModal(); // Callback to refresh modal on project update
          this.renderWorkerView(user); // Also refresh the underlying view to update stat counts!
        });
      }
    };

    let relevantProjects = DB.getProjectsForUser(user);

    const html = `
      <div style="display:flex; flex-direction:column; gap:16px;">
        <div style="border-bottom:1px solid var(--border-color); padding-bottom:10px;">
          <h4 style="font-family:var(--font-title); font-size:1.1rem; color:var(--text-primary);"><i class="fas fa-building" style="color:var(--primary);"></i> Công Trình Phụ Trách</h4>
          <p style="font-size:0.78rem; color:var(--text-secondary); margin-top:2px;">Tổng cộng: <strong>${relevantProjects.length} công trình đang chạy</strong></p>
        </div>

        <div class="report-list" id="modal-project-list-container" style="max-height:500px; overflow-y:auto; padding-right:4px; display:flex; flex-direction:column; gap:16px;">
          <!-- Projects cards will be rendered dynamically -->
        </div>
      </div>
    `;

    const modal = Modal.create('Công Trình Phụ Trách', html);
    refreshModal();
  },

  // 3.2.1 OPEN COMPLETED PROJECTS LIST MODAL FOR KTS, SALES, MARKETING
  openEmployeeCompletedProjectsModal(user) {
    const completedProjects = DB.getProjects().filter(p => p.isCompleted);

    if (completedProjects.length === 0) {
      Modal.create('Công Trình Đã Hoàn Thành', `
        <div style="text-align:center; padding:32px 16px; color:var(--text-muted);">
          <i class="fas fa-archive" style="font-size:2rem; color:var(--primary); margin-bottom:8px;"></i>
          <p style="font-size:0.85rem;">Không có công trình nào đã hoàn thành.</p>
        </div>
      `);
      return;
    }

    const html = `
      <div style="display:flex; flex-direction:column; gap:16px;">
        <div style="border-bottom:1px solid var(--border-color); padding-bottom:10px;">
          <h4 style="font-family:var(--font-title); font-size:1.1rem; color:var(--text-primary);"><i class="fas fa-check-circle" style="color:var(--status-approved);"></i> Công Trình Đã Xong</h4>
          <p style="font-size:0.78rem; color:var(--text-secondary); margin-top:2px;">Tổng số: <strong>${completedProjects.length} công trình</strong></p>
        </div>

        <div class="report-list" style="max-height:500px; overflow-y:auto; padding-right:4px; display:flex; flex-direction:column; gap:16px;">
          ${completedProjects.map(p => `
            <div class="report-card employee-completed-card" data-id="${p.id}" style="cursor:pointer; background-color:var(--bg-secondary); border:1px solid var(--border-color); border-radius:20px; padding:18px; display:flex; justify-content:space-between; align-items:center; gap:16px;">
              <div style="flex:1;">
                <h4 style="font-family:var(--font-title); font-size:1.05rem; font-weight:700; color:var(--text-primary);">${p.name}</h4>
                <p style="font-size:0.75rem; color:var(--text-muted); margin-top:4px;">Bàn giao: ${p.completedAt ? new Date(p.completedAt).toLocaleDateString('vi-VN') : ''}</p>
              </div>
              <div style="display:flex; align-items:center; gap:8px;">
                <button class="btn-download-excel-emp" data-project="${p.id}" style="background-color:rgba(16, 185, 129, 0.12); border:1px solid rgba(16, 185, 129, 0.3); color:#10B981; padding:8px 12px; border-radius:8px; font-size:0.78rem; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:4px; height:auto; line-height:1.2;" title="Tải báo cáo Excel">
                  <i class="fas fa-file-excel"></i> Xuất Excel
                </button>
                <span class="status-badge approved" style="font-weight:700; background-color:rgba(78, 141, 124, 0.15); white-space:nowrap;">
                  <i class="fas fa-check-circle"></i> Đã Xong
                </span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    const modal = Modal.create('Công Trình Đã Hoàn Thành', html);

    // Event handler for excel export
    modal.element.querySelectorAll('.btn-download-excel-emp').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const prjId = btn.getAttribute('data-project');
        this.exportProjectToExcel(prjId);
      });
    });

    // Event handler for completed card click (to open read-only drawer)
    modal.element.querySelectorAll('.employee-completed-card').forEach(card => {
      card.addEventListener('click', () => {
        const prjId = card.getAttribute('data-id');
        this.openProjectDetailsDrawer(prjId, user, () => {});
      });
    });
  },



  // 5. OPEN REWORK MODAL DIALOG (BÁO LỖI SỬA HÀNG)
  openReworkModal(projectId, user, onUpdate = null) {
    const db = DB.load();
    const workshopWorkers = db.users.filter(u => u.role === 'lead_worker' || u.role === 'assistant_worker');
    const isSupervisor = user.role === 'manager' || user.role === 'kts' || user.role === 'sales';

    const html = `
      <form id="rework-form" style="display:flex; flex-direction:column; gap:16px;">
        <div>
          <label class="form-label">Mô tả lỗi sản xuất / thi công</label>
          <textarea id="rework-desc" class="form-textarea" placeholder="Ví dụ: Cánh tủ bếp bị mẻ Acrylic, ray ngăn kéo trượt rít..." required></textarea>
        </div>

        ${isSupervisor ? `
          <div>
            <label class="form-label">Chỉ định Thợ Xưởng xử lý</label>
            <select id="rework-assigned" class="form-select" required>
              ${workshopWorkers.map(w => `<option value="${w.id}">${w.name}</option>`).join('')}
            </select>
          </div>
        ` : ''}

        <button type="submit" class="btn-primary" style="margin-top:12px; background:linear-gradient(135deg, var(--status-rejected), #A54343);">
          <i class="fas fa-exclamation-triangle"></i> Gửi Yêu Cầu Sửa Hàng
        </button>
      </form>
    `;

    const modal = Modal.create('Báo Lỗi & Yêu Cầu Sửa Hàng', html);

    document.getElementById('rework-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const desc = document.getElementById('rework-desc').value;
      const workerSelect = document.getElementById('rework-assigned');
      const workerId = workerSelect ? workerSelect.value : '';

      DB.triggerRework(projectId, desc, workerId, user.id);
      Toast.success('Đã gắn nhãn [SỬA HÀNG LỖI] thành công.');
      modal.close();
      if (onUpdate) onUpdate(); else this.renderWorkerView(user);
    });
  },

  // 6. OPEN SCOPE MODAL DIALOG (PHÁT SINH THÊM HẠNG MỤC)
  openScopeModal(projectId, user, onUpdate = null) {
    const project = DB.getProject(projectId);
    const db = DB.load();
    const workers = db.users.filter(u => u.role !== 'manager');
    const isSupervisor = user.role === 'manager' || user.role === 'kts' || user.role === 'sales';

    const html = `
      <div class="manager-tabs" style="margin-bottom:16px;">
        <button type="button" class="tab-btn active" id="btn-scope-small">Phát Sinh Nhỏ</button>
        <button type="button" class="tab-btn" id="btn-scope-large">Phát Sinh Lớn</button>
      </div>

      <!-- Small Scope Form -->
      <form id="scope-small-form" style="display:flex; flex-direction:column; gap:16px;">
        <p style="font-size:0.8rem; color:var(--text-secondary); line-height:1.4;">
          <strong>Quy tắc Phát sinh Nhỏ:</strong> Giữ nguyên dự án + Gắn nhãn Cam <code>[PHÁT SINH NHỎ]</code> + Cộng thêm ngày deadline + Giao sub-task xử lý nhanh.
        </p>

        <div>
          <label class="form-label">Tên hạng mục phát sinh nhỏ</label>
          <input type="text" id="small-scope-title" class="form-input" placeholder="Ví dụ: Làm thêm tab đầu giường, kệ giày..." required style="padding-left:14px;">
        </div>

        ${isSupervisor ? `
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
            <div>
              <label class="form-label">Gia hạn deadline (ngày)</label>
              <select id="small-scope-days" class="form-select">
                <option value="1">+1 ngày</option>
                <option value="2" selected>+2 ngày</option>
                <option value="3">+3 ngày</option>
                <option value="5">+5 ngày</option>
              </select>
            </div>
            <div>
              <label class="form-label">Giao nhân sự phụ trách</label>
              <select id="small-scope-worker" class="form-select" required>
                ${workers.map(w => `<option value="${w.id}">${w.name}</option>`).join('')}
              </select>
            </div>
          </div>
        ` : ''}

        <button type="submit" class="btn-primary" style="margin-top:12px; background:linear-gradient(135deg, var(--status-pending), #B07C59);">
          Xác Nhận Phát Sinh Nhỏ
        </button>
      </form>

      <!-- Large Scope Form (Hidden initially) -->
      <form id="scope-large-form" style="display:none; flex-direction:column; gap:16px;">
        <p style="font-size:0.8rem; color:var(--text-secondary); line-height:1.4;">
          <strong>Quy tắc Phát sinh Lớn:</strong> Tạo hẳn một thẻ công trình riêng biệt mang tên <code>[PHÁT SINH] - [Tên dự án] - [Hạng mục]</code>. Chạy lại từ Bước 1.
        </p>

        <div>
          <label class="form-label">Tên hạng mục phát sinh lớn</label>
          <input type="text" id="large-scope-title" class="form-input" placeholder="Ví dụ: Làm thêm nội thất phòng ngủ Master, phòng thờ..." style="padding-left:14px;">
        </div>

        ${isSupervisor ? `
          <div>
            <label class="form-label">Hạn hoàn thành mong muốn</label>
            <input type="date" id="large-scope-deadline" class="form-input" style="padding-left:14px;">
          </div>
        ` : ''}

        <button type="submit" class="btn-primary" style="margin-top:12px;">
          Tạo Thẻ Công Trình Phát Sinh Mới
        </button>
      </form>
    `;

    const modal = Modal.create('Xử Lý Phát Sinh Hạng Mục', html);

    // Toggle Forms
    const btnSmall = document.getElementById('btn-scope-small');
    const btnLarge = document.getElementById('btn-scope-large');
    const formSmall = document.getElementById('scope-small-form');
    const formLarge = document.getElementById('scope-large-form');

    btnSmall.addEventListener('click', () => {
      btnSmall.classList.add('active');
      btnLarge.classList.remove('active');
      formSmall.style.display = 'flex';
      formLarge.style.display = 'none';
    });

    btnLarge.addEventListener('click', () => {
      btnLarge.classList.add('active');
      btnSmall.classList.remove('active');
      formLarge.style.display = 'flex';
      formSmall.style.display = 'none';

      // Auto fill date format default
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 15); // +15 days
      document.getElementById('large-scope-deadline').value = defaultDate.toISOString().split('T')[0];
    });

    // Submit Small Form
    formSmall.addEventListener('submit', (e) => {
      e.preventDefault();
      const desc = document.getElementById('small-scope-title').value;
      const daysSelect = document.getElementById('small-scope-days');
      const days = daysSelect ? daysSelect.value : '2';
      const workerSelect = document.getElementById('small-scope-worker');
      const workerId = workerSelect ? workerSelect.value : '';

      DB.addSmallScope(projectId, desc, days, workerId, user.id);
      Toast.success('Đã thêm phát sinh nhỏ thành công.');
      modal.close();
      if (onUpdate) onUpdate(); else this.renderWorkerView(user);
    });

    // Submit Large Form
    formLarge.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('large-scope-title').value;
      const dlInput = document.getElementById('large-scope-deadline');
      let dl = dlInput ? dlInput.value : '';
      
      if (!dl) {
        const defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() + 15);
        dl = defaultDate.toISOString().split('T')[0];
      }

      if (!title || !dl) {
        Toast.error('Vui lòng điền đầy đủ thông tin.');
        return;
      }

      DB.addLargeScope(project.name, title, dl, user.id);
      Toast.success('Đã khởi tạo thẻ công trình phát sinh lớn ở bước 1.');
      modal.close();
      if (onUpdate) onUpdate(); else this.renderWorkerView(user);
    });
  },

  // 7. RENDER MANAGER PORTAL
  renderManagerView(user) {
    const body = document.getElementById('app-body-content');
    const roleTitle = user.role === 'manager' ? 'Sếp' : user.role === 'kts' ? 'KTS' : user.role === 'sales' ? 'Sale' : 'MKT';
    const roleIcon = user.role === 'manager' ? '💼' : user.role === 'kts' ? '📐' : user.role === 'sales' ? '🤝' : '📢';

    body.innerHTML = `
      <div class="welcome-section fade-in">
        <div class="welcome-user">Chào ${roleTitle} ${user.name} ${roleIcon}</div>
        <div class="welcome-date">Bảng giám sát tổng quan thời gian thực</div>
      </div>

      <!-- Manager Tab Buttons -->
      <div class="manager-tabs fade-in" style="overflow-x:auto; white-space:nowrap; gap:4px; padding:4px;">
        <button class="tab-btn active" id="tab-kanban-btn" style="flex:none; padding:8px 16px;"><i class="fas fa-columns"></i> Bảng Tiến Độ</button>
        <button class="tab-btn" id="tab-completed-btn" style="flex:none; padding:8px 16px;"><i class="fas fa-archive"></i> Đã Hoàn Thành</button>
        <button class="tab-btn" id="tab-logs-btn" style="flex:none; padding:8px 16px;"><i class="fas fa-history"></i> Nhật Ký</button>
        <button class="tab-btn" id="tab-dashboard-btn" style="flex:none; padding:8px 16px;"><i class="fas fa-chart-pie"></i> Báo Cáo</button>
      </div>

      <!-- Content sections -->
      <div id="manager-tab-content">
        <!-- Will render either Kanban, Logs, Attendance, or Dashboard dynamically -->
      </div>
    `;

    // Clean up any existing manager FAB
    const oldFab = document.getElementById('manager-add-project-btn');
    if (oldFab) oldFab.remove();

    // Recreate the FAB directly under the app shell so it stays fixed on scroll
    const shell = document.getElementById('app-shell-container');
    if (shell) {
      const fabBtn = document.createElement('button');
      fabBtn.className = 'fab';
      fabBtn.id = 'manager-add-project-btn';
      fabBtn.title = 'Thêm công trình mới';
      fabBtn.innerHTML = '<i class="fas fa-plus"></i>';
      shell.appendChild(fabBtn);

      fabBtn.addEventListener('click', () => {
        this.openCreateProjectModal(user, () => {
          if (btnKanban.classList.contains('active')) {
            loadKanban();
          } else if (btnCompleted.classList.contains('active')) {
            loadCompleted();
          } else if (btnLogs.classList.contains('active')) {
            loadLogs();
          } else {
            loadDashboard();
          }
        });
      });
    }

    // Tab clicks
    const btnKanban = document.getElementById('tab-kanban-btn');
    const btnCompleted = document.getElementById('tab-completed-btn');
    const btnLogs = document.getElementById('tab-logs-btn');
    const btnAttendance = document.getElementById('tab-attendance-btn');
    const btnDashboard = document.getElementById('tab-dashboard-btn');

    const setActiveTab = (activeBtn) => {
      [btnKanban, btnCompleted, btnLogs, btnAttendance, btnDashboard].forEach(btn => {
        if (btn) btn.classList.remove('active');
      });
      activeBtn.classList.add('active');
    };

    const loadKanban = () => {
      setActiveTab(btnKanban);
      this.renderManagerKanban(user);
    };

    const loadCompleted = () => {
      setActiveTab(btnCompleted);
      this.renderManagerCompleted(user);
    };

    const loadLogs = () => {
      setActiveTab(btnLogs);
      this.renderManagerLogs(user);
    };

    const loadAttendance = () => {
      setActiveTab(btnAttendance);
      this.renderManagerAttendance(user);
    };

    const loadDashboard = () => {
      setActiveTab(btnDashboard);
      this.renderManagerDashboard();
    };

    btnKanban.addEventListener('click', loadKanban);
    btnCompleted.addEventListener('click', loadCompleted);
    btnLogs.addEventListener('click', loadLogs);
    if (btnAttendance) btnAttendance.addEventListener('click', loadAttendance);
    btnDashboard.addEventListener('click', loadDashboard);

    // Initial load
    loadKanban();
  },

  // 7.1 RENDER LOGS LIST WITH FILTERS (MANAGER TAB)
  renderManagerLogs(user) {
    const container = document.getElementById('manager-tab-content');
    const projects = DB.getProjects();
    const db = DB.load();
    const workers = db.users.filter(u => u.role !== 'manager');

    // Aggregate all daily logs from all projects
    let allLogs = [];
    projects.forEach(p => {
      p.dailyLogs.forEach(l => {
        if (l.approved !== false) {
          allLogs.push({
            ...l,
            projectId: p.id,
            projectName: p.name
          });
        }
      });
    });

    // Sort all logs by date descending
    allLogs.sort((a, b) => new Date(b.date) - new Date(a.date));

    container.innerHTML = `
      <div class="fade-in" style="display:flex; flex-direction:column; gap:16px;">
        <div style="background-color:var(--bg-secondary); border:1px solid var(--border-color); border-radius:16px; padding:16px; display:flex; flex-direction:column; gap:12px;">
          <h4 style="font-family:var(--font-title); font-size:0.9rem; font-weight:600;"><i class="fas fa-filter"></i> Bộ Lọc Báo Cáo</h4>
          
          <div style="display:flex; flex-direction:column; gap:10px;">
            <div>
              <label class="form-label" style="font-size:0.7rem; margin-bottom:4px;">Lọc theo Nhân sự</label>
              <select id="filter-log-reporter" class="form-select" style="font-size:0.8rem; padding:8px 12px; height:auto;">
                <option value="all">Tất cả nhân sự</option>
                ${workers.map(w => `<option value="${w.id}">${w.name}</option>`).join('')}
              </select>
            </div>
            
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
              <div>
                <label class="form-label" style="font-size:0.7rem; margin-bottom:4px;">Ngày báo cáo</label>
                <input type="date" id="filter-log-date" class="form-input" style="font-size:0.8rem; padding:8px 12px; padding-left:14px; height:40px;">
              </div>
              <div>
                <label class="form-label" style="font-size:0.7rem; margin-bottom:4px;">Trạng thái</label>
                <select id="filter-log-status" class="form-select" style="font-size:0.8rem; padding:8px 12px; height:auto;">
                  <option value="all">Tất cả trạng thái</option>
                  <option value="on_track">Đúng tiến độ ✅</option>
                  <option value="delayed">Bị chậm ⚠️</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div class="report-list" id="filtered-logs-list">
          <!-- Render logs dynamically -->
        </div>
      </div>
    `;

    const logsList = document.getElementById('filtered-logs-list');
    const reporterSelect = document.getElementById('filter-log-reporter');
    const dateInput = document.getElementById('filter-log-date');
    const statusSelect = document.getElementById('filter-log-status');

    const filterAndRender = () => {
      const selectedReporter = reporterSelect.value;
      const selectedDate = dateInput.value;
      const selectedStatus = statusSelect.value;

      const filtered = allLogs.filter(l => {
        const matchReporter = selectedReporter === 'all' || l.reporterId === selectedReporter;
        const matchDate = !selectedDate || l.date === selectedDate;
        const matchStatus = selectedStatus === 'all' || l.status === selectedStatus;
        return matchReporter && matchDate && matchStatus;
      });

      if (filtered.length === 0) {
        logsList.innerHTML = `
          <div style="text-align:center; padding: 40px; color:var(--text-muted); background-color:var(--bg-secondary); border-radius:20px; border:1px solid var(--border-color)">
            <i class="fas fa-folder-open" style="font-size:2rem; margin-bottom:12px;"></i>
            <p>Không tìm thấy báo cáo nào khớp với bộ lọc.</p>
          </div>
        `;
        return;
      }

      logsList.innerHTML = filtered.map(l => {
        const roleDisplay = l.reporterRole === 'lead_worker' ? 'Thợ chính' : l.reporterRole === 'assistant_worker' ? 'Thợ phụ' : l.reporterRole === 'kts' ? 'Thiết kế' : l.reporterRole === 'sales' ? 'Sale' : 'Khác';
        return `
          <div class="report-card manager-log-card" data-project="${l.projectId}" data-date="${l.date}" data-reporter="${l.reporterName}" style="cursor:pointer; background-color:var(--bg-secondary); border:1px solid var(--border-color); border-radius:16px; padding:16px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
              <div>
                <strong style="font-size:0.85rem; color:var(--text-primary);">${l.reporterName}</strong>
                <div style="font-size:0.7rem; color:var(--text-muted);">${roleDisplay} • ${l.date}</div>
              </div>
              <div style="display:flex; align-items:center; gap:8px;">
                <span class="status-badge ${l.status === 'on_track' ? 'approved' : 'rejected'}" style="margin-right:0;">
                  ${l.status === 'on_track' ? 'Đúng tiến độ' : 'Bị chậm'}
                </span>
                ${user.role === 'manager' ? `
                  <button class="btn-delete-log-from-tab" data-project="${l.projectId}" data-log-id="${l.id}" style="background:none; border:none; padding:4px 6px; color:var(--status-rejected); cursor:pointer; font-size:0.85rem;" title="Xóa báo cáo này"><i class="fas fa-trash-alt"></i></button>
                ` : ''}
              </div>
            </div>
            
            <p style="font-size:0.75rem; color:var(--primary); font-weight:600; margin-bottom:4px;"><i class="fas fa-building"></i> ${l.projectName}</p>
            <p style="font-size:0.8rem; color:var(--text-secondary); line-height:1.4; overflow:hidden; text-overflow:ellipsis; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;">${l.note}</p>
            
            ${l.photos && l.photos.length > 0 ? `
              <div style="display:flex; gap:6px; margin-top:8px; overflow-x:auto;">
                ${l.photos.map(pUrl => `<img src="${pUrl}" style="width:50px; height:38px; object-fit:cover; border-radius:4px; border:1px solid var(--border-color);">`).join('')}
              </div>
            ` : ''}
          </div>
        `;
      }).join('');

      // Add click listener to open detailed log modal
      logsList.querySelectorAll('.manager-log-card').forEach(card => {
        card.addEventListener('click', () => {
          const prjId = card.getAttribute('data-project');
          const date = card.getAttribute('data-date');
          const reporter = card.getAttribute('data-reporter');
          const prj = projects.find(p => p.id === prjId);
          if (prj) {
            const log = prj.dailyLogs.find(dl => dl.date === date && dl.reporterName === reporter);
            if (log) {
              this.openLogDetailModal(log, prj);
            }
          }
        });
      });

      // Add delete log click listener
      logsList.querySelectorAll('.btn-delete-log-from-tab').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation(); // Prevent opening detail modal
          const prjId = btn.getAttribute('data-project');
          const logId = btn.getAttribute('data-log-id');
          if (confirm('Bạn có chắc chắn muốn XÓA BÁO CÁO này khỏi hệ thống không?\nHành động này không thể khôi phục!')) {
            DB.deleteDailyLog(prjId, logId, user.id);
            Toast.success('Đã xóa báo cáo thi công thành công.');
            
            // Delete from local memory list dynamically so filterAndRender doesn't reload deleted item
            const projObj = projects.find(p => p.id === prjId);
            if (projObj && projObj.dailyLogs) {
              const dlIdx = projObj.dailyLogs.findIndex(dl => dl.id === logId);
              if (dlIdx > -1) {
                projObj.dailyLogs.splice(dlIdx, 1);
              }
            }
            const logIdx = allLogs.findIndex(al => al.id === logId);
            if (logIdx > -1) {
              allLogs.splice(logIdx, 1);
            }

            filterAndRender(); // Re-render the logs tab
          }
        });
      });
    };

    // Attach filter listeners
    reporterSelect.addEventListener('change', filterAndRender);
    dateInput.addEventListener('change', filterAndRender);
    statusSelect.addEventListener('change', filterAndRender);

    // Initial render
    filterAndRender();
  },

  // 7.2 RENDER ATTENDANCE SHEET AND MANAGEMENT (MANAGER TAB)
  renderManagerAttendance(user) {
    const container = document.getElementById('manager-tab-content');

    // Default selected date is today
    let selectedDate = new Date().toISOString().split('T')[0];

    const renderSheet = () => {
      const records = DB.getAttendance(selectedDate);
      const presentCount = records.filter(r => r.status === 'present').length;
      const absentCount = records.filter(r => r.status === 'absent').length;

      container.innerHTML = `
        <div class="fade-in" style="display:flex; flex-direction:column; gap:20px;">
          <!-- Date filter -->
          <div style="background-color:var(--bg-secondary); border:1px solid var(--border-color); border-radius:16px; padding:16px; display:flex; justify-content:space-between; align-items:center;">
            <div>
              <label class="form-label" style="font-size:0.75rem; margin-bottom:4px;">Chọn Ngày Điểm Danh</label>
              <input type="date" id="attendance-sheet-date" class="form-input" value="${selectedDate}" style="padding-left:14px; width:160px; font-size:0.85rem; padding:8px 12px; height:40px;">
            </div>
            <div style="text-align:right;">
              <span class="status-badge approved" style="font-weight:700;"><i class="fas fa-check-circle"></i> Đi làm: ${presentCount}</span>
              <span class="status-badge rejected" style="font-weight:700; margin-left:6px;"><i class="fas fa-times-circle"></i> Vắng: ${absentCount}</span>
            </div>
          </div>

          <!-- Attendance list -->
          <div class="report-list">
            ${records.map(r => {
        const roleDisplay = r.userRole === 'lead_worker' ? 'Thợ chính' : r.userRole === 'assistant_worker' ? 'Thợ phụ' : r.userRole === 'kts' ? 'Thiết kế' : r.userRole === 'sales' ? 'Sale' : 'Marketing';
        let badgeHtml = '';
        if (r.status === 'present') {
          badgeHtml = `<span class="status-badge approved" style="font-weight:700; font-size:0.7rem;"><i class="fas fa-check"></i> Đang làm việc (${r.time})</span>`;
        } else if (r.status === 'absent') {
          badgeHtml = `<span class="status-badge rejected" style="font-weight:700; font-size:0.7rem;"><i class="fas fa-ban"></i> Vắng mặt</span>`;
        } else {
          badgeHtml = `<span class="status-badge pending" style="background-color:rgba(255,255,255,0.05); color:var(--text-muted); font-weight:600; font-size:0.7rem;"><i class="fas fa-question-circle"></i> Chưa chấm công</span>`;
        }

        let assignInfoHtml = '';
        if (r.status === 'present' && r.workingProjectName) {
          const workshopBadge = r.isWorkingAtWorkshop ? ` <span style="background-color: var(--primary); color: var(--bg-primary); padding: 1px 6px; border-radius: 4px; font-size: 0.6rem; font-weight: 700; margin-left: 6px;"><i class="fas fa-warehouse"></i> Độc lập tại xưởng</span>` : '';
          assignInfoHtml = `
            <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:4px; display:flex; flex-direction:column; gap:2px; background:rgba(255,255,255,0.02); padding:6px 10px; border-radius:8px; border:1px dashed var(--border-color); text-align: left;">
              <span>Dự án hôm nay: <strong style="color:var(--primary);">${r.workingProjectName}</strong>${workshopBadge}</span>
              ${r.dailyWorkload ? `<span>Nhiệm vụ: <span style="color:var(--text-primary); font-weight:500;">${r.dailyWorkload}</span></span>` : ''}
            </div>
          `;
        } else if (r.note) {
          assignInfoHtml = `<div style="font-size:0.75rem; color:var(--primary); margin-top:4px; font-style:italic;">"${r.note}"</div>`;
        }

        return `
                <div style="background-color:var(--bg-secondary); border:1px solid var(--border-color); border-radius:20px; padding:16px; display:flex; justify-content:space-between; align-items:center;">
                  <div style="display:flex; align-items:center; gap:12px;">
                    <img src="${r.userAvatar}" style="width:40px; height:40px; border-radius:50%; object-fit:cover; border:1px solid var(--border-color);">
                    <div>
                      <strong style="font-size:0.85rem; color:var(--text-primary);">${r.userName}</strong>
                      <div style="font-size:0.7rem; color:var(--text-muted);">${roleDisplay}</div>
                      ${assignInfoHtml}
                    </div>
                  </div>
                  <div style="text-align:right; display:flex; flex-direction:column; align-items:flex-end; gap:8px;">
                    ${badgeHtml}
                    <button class="btn-edit-attendance" data-user="${r.userId}" style="background:none; border:1px solid var(--border-color); color:var(--text-secondary); border-radius:6px; padding:2px 8px; font-size:0.75rem; cursor:pointer;">
                      <i class="fas fa-edit"></i> Sửa
                    </button>
                  </div>
                </div>
              `;
      }).join('')}
          </div>
        </div>
      `;

      // Date change listener
      document.getElementById('attendance-sheet-date').addEventListener('change', (e) => {
        selectedDate = e.target.value;
        renderSheet();
      });

      // Edit attendance listener
      container.querySelectorAll('.btn-edit-attendance').forEach(btn => {
        btn.addEventListener('click', () => {
          const wId = btn.getAttribute('data-user');
          const record = records.find(rec => rec.userId === wId);
          if (record) {
            this.openEditAttendanceModal(record, () => {
              renderSheet();
            });
          }
        });
      });
    };

    renderSheet();
  },

  // 7.3 OPEN ATTENDANCE EDIT MODAL DIALOG (FOR MANAGER)
  openEditAttendanceModal(record, onSaved) {
    const activeProjects = DB.getProjects().filter(p => !p.isCompleted);

    const html = `
      <form id="edit-attendance-form" style="display:flex; flex-direction:column; gap:16px;">
        <div>
          <label class="form-label">Nhân sự: <strong>${record.userName}</strong></label>
          <div style="font-size:0.75rem; color:var(--text-muted); margin-top:-4px;">Ngày điều chỉnh: ${record.date}</div>
        </div>

        <div>
          <label class="form-label">Trạng thái chấm công</label>
          <select id="edit-att-status" class="form-select" required style="height:auto;">
            <option value="present" ${record.status === 'present' ? 'selected' : ''}>Đi làm ✅</option>
            <option value="absent" ${record.status === 'absent' ? 'selected' : ''}>Vắng mặt ❌</option>
            <option value="no_record" ${record.status === 'no_record' ? 'selected' : ''}>Chưa chấm công ⏱️</option>
          </select>
        </div>

        <div style="display:grid; grid-template-columns:1fr; gap:12px;" id="edit-att-time-box">
          <div>
            <label class="form-label">Giờ vào làm</label>
            <input type="text" id="edit-att-time" class="form-input" value="${record.time || '08:00'}" placeholder="Ví dụ: 08:00" style="padding-left:14px; height:40px;">
          </div>

          <div>
            <label class="form-label">Phân công công trình hôm nay</label>
            <select id="edit-att-project-id" class="form-select">
              <option value="">-- Chưa phân công --</option>
              ${activeProjects.map(p => `<option value="${p.id}" ${record.workingProjectId === p.id ? 'selected' : ''}>${p.name}</option>`).join('')}
            </select>
          </div>

          <div>
            <label class="form-label">Khối lượng công việc giao thợ trong ngày</label>
            <textarea id="edit-att-workload" class="form-textarea" placeholder="Ví dụ: Đo đạc và ráp tủ áo master, bắn silicone hoàn thiện..." style="height: 60px; padding-left:14px;">${record.dailyWorkload || ''}</textarea>
          </div>

          <div style="margin-top: 4px;">
            <label style="display:flex; align-items:center; gap:8px; font-size:0.8rem; color:var(--text-secondary); cursor:pointer;">
              <input type="checkbox" id="edit-att-is-workshop" ${record.isWorkingAtWorkshop ? 'checked' : ''} style="width:16px; height:16px; accent-color:var(--primary); cursor:pointer;">
              <span>Làm việc độc lập tại xưởng (Tự động duyệt báo cáo hôm nay)</span>
            </label>
          </div>
        </div>

        <div>
          <label class="form-label">Ghi chú công việc / Lý do vắng</label>
          <textarea id="edit-att-note" class="form-textarea" placeholder="Ví dụ: Lắp đặt tủ bếp Vinhomes hoặc Xin phép nghỉ..." required>${record.note}</textarea>
        </div>

        <button type="submit" class="btn-primary" style="margin-top:12px;">Lưu Thay Đổi</button>
      </form>
    `;

    const modal = Modal.create('Điều Chỉnh Chấm Công', html);

    // Toggle Time box based on status
    const statusSelect = document.getElementById('edit-att-status');
    const timeBox = document.getElementById('edit-att-time-box');
    statusSelect.addEventListener('change', () => {
      if (statusSelect.value === 'present') {
        timeBox.style.display = 'block';
      } else {
        timeBox.style.display = 'none';
      }
    });

    // Toggle is_workshop on project selection change
    const selectProject = document.getElementById('edit-att-project-id');
    const cbWorkshop = document.getElementById('edit-att-is-workshop');
    if (selectProject && cbWorkshop) {
      selectProject.addEventListener('change', () => {
        const prjId = selectProject.value;
        if (prjId) {
          const matched = activeProjects.find(p => p.id === prjId);
          if (matched && matched.step < 8) {
            cbWorkshop.checked = true;
          } else {
            cbWorkshop.checked = false;
          }
        } else {
          cbWorkshop.checked = false;
        }
      });
    }

    // Initial check
    if (record.status !== 'present') {
      timeBox.style.display = 'none';
    }

    document.getElementById('edit-attendance-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const status = statusSelect.value;
      const time = status === 'present' ? document.getElementById('edit-att-time').value : '';
      const note = document.getElementById('edit-att-note').value;

      let workingProjectId = '';
      let workingProjectName = '';
      let dailyWorkload = '';
      let isWorkingAtWorkshop = false;

      if (status === 'present') {
        workingProjectId = document.getElementById('edit-att-project-id').value;
        dailyWorkload = document.getElementById('edit-att-workload').value;
        isWorkingAtWorkshop = cbWorkshop ? cbWorkshop.checked : false;
        const matched = activeProjects.find(p => p.id === workingProjectId);
        workingProjectName = matched ? matched.name : '';
      }

      DB.updateAttendance(record.userId, record.date, status, time, note, workingProjectId, workingProjectName, dailyWorkload, isWorkingAtWorkshop);
      Toast.success('Đã lưu thay đổi chấm công!');
      modal.close();
      onSaved();
    });
  },

  // 8. RENDER KANBAN PIPELINE FOR MANAGER
  renderManagerKanban(user) {
    const container = document.getElementById('manager-tab-content');
    const projects = DB.getProjects().filter(p => !p.isCompleted);

    container.innerHTML = `
      <!-- Column selector list for Mobile viewport -->
      <div class="fade-in" style="margin-bottom:16px;">
        <label class="form-label" style="font-size:0.75rem;">Xem nhanh theo bước tiến độ:</label>
        <div style="display:flex; gap:8px; overflow-x:auto; padding-bottom:8px; white-space:nowrap;" id="kanban-step-filters">
          <button class="tab-btn active" data-step="all" style="padding:6px 12px; font-size:0.8rem;">Tất cả (${projects.length})</button>
          ${STEPS.map(s => {
      const count = projects.filter(p => p.step === s.num).length;
      return `<button class="tab-btn" data-step="${s.num}" style="padding:6px 12px; font-size:0.8rem; white-space:nowrap;">${s.num}. ${s.title} (${count})</button>`;
    }).join('')}
        </div>
      </div>

      <div class="report-list fade-in" id="kanban-cards-container">
        <!-- Dynamically rendered filtered projects -->
      </div>
    `;

    const cardsContainer = document.getElementById('kanban-cards-container');
    const filters = document.getElementById('kanban-step-filters');

    const filterProjects = (stepValue) => {
      let filtered = projects;
      if (stepValue !== 'all') {
        filtered = projects.filter(p => p.step === parseInt(stepValue));
      }

      if (filtered.length === 0) {
        cardsContainer.innerHTML = `
          <div style="text-align:center; padding: 40px 20px; color:var(--text-muted); background-color:var(--bg-secondary); border-radius:20px; border:1px solid var(--border-color)">
            <i class="fas fa-folder-open" style="font-size:2rem; margin-bottom:12px;"></i>
            <p>Không có công trình nào ở giai đoạn này.</p>
          </div>
        `;
        return;
      }

      cardsContainer.innerHTML = filtered.map(p => {
        const stepInfo = STEPS.find(s => s.num === p.step) || STEPS[0];
        const isOverdue = new Date(p.deadline) < new Date() && p.step < 4;
        const pendingRework = p.subtasks.filter(st => st.type === 'rework' && st.status === 'pending');
        const pendingScope = p.subtasks.filter(st => st.type === 'small_scope' && st.status === 'pending');

        return `
          <div class="report-card manager-project-card" data-id="${p.id}" style="cursor:pointer; position:relative; border-left: 1px solid var(--border-color);">
            <div class="report-card-header">
              <div>
                <div class="report-project" style="font-size:1.05rem;">${p.name}</div>
                <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:2px;">
                  Hạn: <span style="font-weight:700; font-size:0.75rem; padding:2px 8px; border-radius:6px; background-color:${isOverdue ? 'rgba(201, 91, 91, 0.15)' : 'rgba(197, 168, 128, 0.12)'}; border:1px solid ${isOverdue ? 'rgba(201, 91, 91, 0.3)' : 'rgba(197, 168, 128, 0.3)'}; color:${isOverdue ? 'var(--status-rejected)' : 'var(--primary)'};">${p.deadline}${isOverdue ? ' [TRỄ]' : ''}</span>
                  ${p.isSmallScope ? ' <span class="status-badge" style="background-color:rgba(210, 144, 98, 0.12); color:var(--status-pending); font-size:0.65rem; padding: 1px 4px;">[PHÁT SINH NHỎ]</span>' : ''}
                </div>
              </div>
              <div style="text-align:right;">
                <span class="status-badge approved" style="font-weight:700;">
                  GĐ ${p.step}/4
                </span>
                <div style="font-size:0.75rem; font-weight:600; color:var(--primary); margin-top:4px;">${stepInfo.title}</div>
              </div>
            </div>

            <!-- Mini progress segments segmenting the 4 steps -->
            <div style="display:flex; gap:3px; height:5px; margin-top:10px; background-color:rgba(255,255,255,0.02); border-radius:3px; overflow:hidden;">
              ${Array.from({ length: 4 }).map((_, idx) => {
                const isActive = (idx + 1) <= p.step;
                const color = isActive ? 'var(--status-approved)' : 'rgba(255,255,255,0.06)';
                return `<div style="flex:1; background-color:${color}; transition:all 0.3s; border-radius:1px;"></div>`;
              }).join('')}
            </div>

            <!-- Tags section -->
            <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:10px;">
              ${p.isRework ? '<span class="status-badge rejected" style="font-size:0.7rem; font-weight:700;"><i class="fas fa-exclamation-triangle"></i> [SỬA HÀNG LỖI]</span>' : ''}
              ${p.dailyLogs.length > 0 && p.dailyLogs[0].status === 'delayed' ? '<span class="status-badge rejected" style="font-size:0.7rem; background-color:rgba(201, 91, 91, 0.08);"><i class="fas fa-clock"></i> Báo chậm gần nhất</span>' : ''}
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px; padding-top:10px; border-top:1px solid rgba(255,255,255,0.03); font-size:0.75rem; color:var(--text-muted);">
              <span><i class="fas fa-history"></i> Logs: ${p.dailyLogs.length} | Tasks: ${p.subtasks.filter(s => s.status === 'completed').length}/${p.subtasks.length}</span>
              <div style="display:flex; align-items:center; gap:8px;">
                <button class="btn-card-edit-project" data-id="${p.id}" style="background:none; border:none; padding:4px; color:var(--primary); cursor:pointer;" title="Sửa công trình"><i class="fas fa-edit"></i></button>
                <button class="btn-card-delete-project" data-id="${p.id}" style="background:none; border:none; padding:4px; color:var(--status-rejected); cursor:pointer;" title="Xóa công trình"><i class="fas fa-trash-alt"></i></button>
                <span style="font-weight:600; color:var(--primary); margin-left:4px;">Chi tiết &rarr;</span>
              </div>
            </div>
          </div>
        `;
      }).join('');

      // Card clicks to details drawer
      cardsContainer.querySelectorAll('.manager-project-card').forEach(card => {
        card.addEventListener('click', () => {
          const prjId = card.getAttribute('data-id');
          this.openProjectDetailsDrawer(prjId, user, () => {
            filterProjects(stepValue);
          });
        });
      });

      // Edit project click
      cardsContainer.querySelectorAll('.btn-card-edit-project').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const prjId = btn.getAttribute('data-id');
          this.openEditProjectModal(prjId, user, () => {
            // Need to update the local projects array context by re-rendering
            this.renderManagerKanban(user);
          });
        });
      });

      // Delete project click
      cardsContainer.querySelectorAll('.btn-card-delete-project').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const prjId = btn.getAttribute('data-id');
          const prj = DB.getProject(prjId);
          if (prj && confirm(`Bạn có chắc chắn muốn XÓA HOÀN TOÀN công trình: "${prj.name}"?\nThao tác này sẽ xóa tất cả nhật ký, hình ảnh, lịch sử liên quan và không thể khôi phục!`)) {
            DB.deleteProject(prjId, user.id);
            Toast.success('Đã xóa công trình.');
            this.renderManagerKanban(user);
          }
        });
      });
    };

    // Filter bar tab switching
    filters.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        filters.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        filterProjects(btn.getAttribute('data-step'));
      });
    });

    // Initial render
    filterProjects('all');
  },

  // 8.1 RENDER COMPLETED PROJECTS ARCHIVE FOR MANAGER
  renderManagerCompleted(user) {
    const container = document.getElementById('manager-tab-content');
    const completedProjects = DB.getProjects().filter(p => p.isCompleted);

    const headerHtml = `
      <div style="background-color:var(--bg-secondary); border:1px solid var(--border-color); border-radius:16px; padding:16px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:16px;">
        <div>
          <h4 style="font-family:var(--font-title); font-size:0.95rem; font-weight:600;"><i class="fas fa-archive"></i> Kho Lưu Trữ Công Trình (${completedProjects.length})</h4>
          <p style="font-size:0.75rem; color:var(--text-muted); margin-top:4px;">Nơi lưu giữ thông tin các dự án nội thất đã bàn giao cho khách hàng.</p>
        </div>
        <div>
          <button id="btn-import-project-backup" class="btn-primary" style="padding:8px 12px; font-size:0.78rem; font-weight:700; height:auto; background:linear-gradient(135deg, var(--primary), #9E815B); display:flex; align-items:center; gap:6px; border:none; cursor:pointer; border-radius:8px;">
            <i class="fas fa-file-upload"></i> Khôi phục công trình (.json)
          </button>
          <input type="file" id="import-project-file-input" accept=".json" style="display:none;">
        </div>
      </div>
    `;

    if (completedProjects.length === 0) {
      container.innerHTML = `
        <div class="fade-in" style="display:flex; flex-direction:column;">
          ${headerHtml}
          <div style="text-align:center; padding: 40px 20px; color:var(--text-muted); background-color:var(--bg-secondary); border-radius:20px; border:1px solid var(--border-color); margin-top:20px;">
            <i class="fas fa-archive" style="font-size:2.5rem; margin-bottom:12px; color:var(--primary);"></i>
            <h4 style="font-family:var(--font-title); color:var(--text-primary); margin-bottom:8px; font-weight:600;">Chưa Có Công Trình Hoàn Thành</h4>
            <p style="font-size:0.8rem; line-height:1.4;">Các công trình hoàn thành bước 9 và được sếp phê duyệt đóng hồ sơ bàn giao sẽ xuất hiện tại đây.</p>
          </div>
        </div>
      `;
      this.bindImportBackupListener(user);
      return;
    }

    container.innerHTML = `
      <div class="fade-in" style="display:flex; flex-direction:column;">
        ${headerHtml}
        <div class="report-list" style="display:flex; flex-direction:column; gap:16px;">
          ${completedProjects.map(p => `
            <div class="report-card" data-project="${p.id}" style="cursor:pointer; background-color:var(--bg-secondary); border:1px solid var(--border-color); border-radius:20px; padding:18px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
              <div style="flex:1; min-width:200px;">
                <h4 style="font-family:var(--font-title); font-size:1.05rem; font-weight:700; color:var(--text-primary);">${p.name}</h4>
                <p style="font-size:0.75rem; color:var(--text-muted); margin-top:4px;">Hạn gốc: ${p.originalDeadline} • Hoàn thành: ${p.completedAt ? new Date(p.completedAt).toLocaleDateString('vi-VN') : ''}</p>
              </div>
              <div style="display:flex; align-items:center; flex-wrap:wrap; gap:8px;">
                <button class="btn-download-excel" data-project="${p.id}" style="background-color:rgba(16, 185, 129, 0.12); border:1px solid rgba(16, 185, 129, 0.3); color:#10B981; padding:8px 12px; border-radius:8px; font-size:0.78rem; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:4px; height:auto; line-height:1.2;" title="Tải báo cáo Excel">
                  <i class="fas fa-file-excel"></i> Xuất Excel
                </button>
                <button class="btn-download-json" data-project="${p.id}" style="background-color:rgba(59, 130, 246, 0.12); border:1px solid rgba(59, 130, 246, 0.3); color:#3B82F6; padding:8px 12px; border-radius:8px; font-size:0.78rem; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:4px; height:auto; line-height:1.2;" title="Tải file cứng sao lưu JSON">
                  <i class="fas fa-file-download"></i> File Backup (JSON)
                </button>
                <button class="btn-completed-edit-project" data-id="${p.id}" style="background:none; border:none; padding:4px; color:var(--primary); cursor:pointer;" title="Sửa công trình"><i class="fas fa-edit"></i></button>
                <button class="btn-completed-delete-project" data-id="${p.id}" style="background:none; border:none; padding:4px; color:var(--status-rejected); cursor:pointer;" title="Xóa công trình giải phóng bộ nhớ"><i class="fas fa-trash-alt"></i></button>
                <span class="status-badge approved" style="font-weight:700; background-color:rgba(78, 141, 124, 0.15); white-space:nowrap;">
                  <i class="fas fa-check-circle"></i> Đã Bàn Giao
                </span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    // Click to view completed project details (read-only)
    container.querySelectorAll('.report-card').forEach(card => {
      card.addEventListener('click', () => {
        const prjId = card.getAttribute('data-project');
        this.openProjectDetailsDrawer(prjId, user, () => {
          this.renderManagerCompleted(user);
        });
      });
    });

    // Excel export handler
    container.querySelectorAll('.btn-download-excel').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent drawer trigger
        const prjId = btn.getAttribute('data-project');
        this.exportProjectToExcel(prjId);
      });
    });

    // JSON export handler
    container.querySelectorAll('.btn-download-json').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent drawer trigger
        const prjId = btn.getAttribute('data-project');
        this.exportProjectToJson(prjId);
      });
    });

    // Edit project click
    container.querySelectorAll('.btn-completed-edit-project').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const prjId = btn.getAttribute('data-id');
        this.openEditProjectModal(prjId, user, () => {
          this.renderManagerCompleted(user);
        });
      });
    });

    // Delete project click
    container.querySelectorAll('.btn-completed-delete-project').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const prjId = btn.getAttribute('data-id');
        const prj = DB.getProject(prjId);
        if (prj && confirm(`Bạn có chắc chắn muốn XÓA HOÀN TOÀN công trình đã hoàn thành: "${prj.name}"?\n\nLưu ý: Hãy chắc chắn bạn đã tải "File Backup (JSON)" của công trình này về máy trước khi xóa để giải phóng dung lượng bộ nhớ. Thao tác xóa sẽ không thể khôi phục tự động!`)) {
          DB.deleteProject(prjId, user.id);
          Toast.success('Đã xóa công trình để giải phóng bộ nhớ.');
          this.renderManagerCompleted(user);
        }
      });
    });

    // Bind import triggers
    this.bindImportBackupListener(user);
  },

  // 9. OPEN PROJECT DETAILS DRAWER (MANAGER VIEW)
  openProjectDetailsDrawer(projectId, user, onUpdate) {
    const project = DB.getProject(projectId);
    const stepInfo = STEPS.find(s => s.num === project.step);
    const nextStepInfo = STEPS.find(s => s.num === project.step + 1);
    const isManagementRole = ['manager', 'kts', 'sales', 'marketing'].includes(user.role);

    // Build interactive Scope Manager HTML (always show, even if empty)
    const buildScopeManagerHtml = (proj) => {
      const scopeItems = proj.scope || [];
      const approvedLogs = (proj.dailyLogs || []).filter(l => l.approved === true || l.approved === 'true');
      const dbUsers = DB.load().users;

      const itemsHtml = scopeItems.length === 0
        ? `<p style="text-align:center; font-size:0.75rem; color:var(--text-muted); margin:12px 0;">Chưa có hạng mục nào. Nhấn "+ Thêm Hạng Mục" để bắt đầu.</p>`
        : scopeItems.map((s, idx) => {
            // --- Subtasks linked to this scope item ---
            const matchedSubtasks = (proj.subtasks || []).filter(st => {
              const match = st.title.match(/^\[([^\]\-]+)\s*-\s*([^\]]+)\]:/);
              const stRoom = match ? match[1].trim() : '';
              const stItem = match ? match[2].trim() : '';
              return stRoom === s.room && stItem === s.item;
            });
            const totalTasks = matchedSubtasks.length;
            const doneTasks = matchedSubtasks.filter(st => st.status === 'completed').length;

            // --- Log-based status ---
            const latestLog = approvedLogs.find(l => l.items && l.items.some(it => it.room === s.room && it.item === s.item));
            const matchedItem = latestLog ? latestLog.items.find(it => it.room === s.room && it.item === s.item) : null;
            const isCompletedByLog = matchedItem && (matchedItem.isCompleted === true || matchedItem.isCompleted === 'true');

            // --- Compute status badge ---
            let statusText, badgeStyle;
            if (isCompletedByLog && totalTasks === 0) {
              // Only log says done, no subtasks
              statusText = 'Hoàn thành ✅';
              badgeStyle = 'background:rgba(16,185,129,0.12); color:var(--status-approved); border:1px solid rgba(16,185,129,0.3);';
            } else if (totalTasks > 0) {
              if (doneTasks === totalTasks) {
                statusText = `${doneTasks}/${totalTasks} xong ✅`;
                badgeStyle = 'background:rgba(16,185,129,0.12); color:var(--status-approved); border:1px solid rgba(16,185,129,0.3);';
              } else if (doneTasks > 0) {
                statusText = `${doneTasks}/${totalTasks} xong ⏱️`;
                badgeStyle = 'background:rgba(245,158,11,0.12); color:var(--status-pending); border:1px solid rgba(245,158,11,0.3);';
              } else {
                statusText = `0/${totalTasks} chưa xong ⏱️`;
                badgeStyle = 'background:rgba(245,158,11,0.12); color:var(--status-pending); border:1px solid rgba(245,158,11,0.3);';
              }
            } else if (matchedItem) {
              statusText = 'Đang làm ⏱️';
              badgeStyle = 'background:rgba(245,158,11,0.12); color:var(--status-pending); border:1px solid rgba(245,158,11,0.3);';
            } else {
              statusText = 'Chờ triển khai ⏳';
              badgeStyle = 'background:rgba(255,255,255,0.05); color:var(--text-muted); border:1px solid var(--border-color);';
            }

            // --- Subtask rows for expandable panel ---
            const subtaskRowsHtml = totalTasks === 0
              ? `<p style="font-size:0.72rem; color:var(--text-muted); text-align:center; margin:8px 0;">Chưa có công việc nào được giao cho hạng mục này.</p>`
              : matchedSubtasks.map(st => {
                  const assignedUser = dbUsers.find(u => u.id === st.assignedTo);
                  const taskDesc = st.title.replace(/^\[[^\]]+\]:/, '').trim();
                  const isDone = st.status === 'completed';
                  const taskBadge = isDone
                    ? `<span style="font-size:0.65rem; font-weight:600; padding:2px 7px; border-radius:5px; white-space:nowrap; background:rgba(16,185,129,0.12); color:var(--status-approved); border:1px solid rgba(16,185,129,0.3);">Xong ✅</span>`
                    : `<span style="font-size:0.65rem; font-weight:600; padding:2px 7px; border-radius:5px; white-space:nowrap; background:rgba(245,158,11,0.1); color:var(--status-pending); border:1px solid rgba(245,158,11,0.25);">Đang làm</span>`;
                  return `
                    <div style="display:flex; align-items:flex-start; gap:8px; padding:7px 10px; background:rgba(0,0,0,0.12); border-radius:8px; border-left:3px solid ${isDone ? 'var(--status-approved)' : 'var(--status-pending)'};">
                      <div style="flex:1; min-width:0;">
                        <div style="font-size:0.77rem; font-weight:600; color:${isDone ? 'var(--text-muted)' : 'var(--text-primary)'}; text-decoration:${isDone ? 'line-through' : 'none'}; word-break:break-word; line-height:1.4;">${taskDesc}</div>
                        <div style="font-size:0.65rem; color:var(--text-muted); margin-top:2px;">
                          <i class="fas fa-user" style="font-size:0.55rem;"></i>
                          ${assignedUser ? assignedUser.name : 'Chưa giao'}
                          ${isDone && st.completedAt ? ` · <i class="fas fa-check" style="font-size:0.55rem;"></i> ${new Date(st.completedAt).toLocaleDateString('vi-VN')}` : ''}
                        </div>
                      </div>
                      ${taskBadge}
                    </div>
                  `;
                }).join('');

            const canEdit = isManagementRole && !proj.isCompleted;
            const hasActivity = latestLog && matchedItem;
            let sourceInfoHtml = '';
            if (hasActivity) {
              sourceInfoHtml = `<i class="fas fa-user-edit" style="font-size:0.55rem;"></i> ${latestLog.reporterName} · ${latestLog.date}`;
            } else if (totalTasks > 0) {
              const lastSt = matchedSubtasks[matchedSubtasks.length - 1];
              const lastAssignee = lastSt?.assignedTo ? (dbUsers.find(u => u.id === lastSt.assignedTo)?.name || 'Thợ') : 'Thợ';
              sourceInfoHtml = `<i class="fas fa-tasks" style="font-size:0.55rem;"></i> ${lastAssignee}`;
            } else {
              sourceInfoHtml = `<i class="fas fa-clock" style="font-size:0.55rem;"></i> Chưa có báo cáo`;
            }

            return `
              <div style="background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:10px; box-shadow:var(--shadow-sm); overflow:hidden;" data-scope-idx="${idx}">
                <!-- Header row: click to expand subtasks -->
                <div class="scope-item-header" data-idx="${idx}" style="padding:10px 12px; display:flex; align-items:flex-start; gap:10px; cursor:pointer;">
                  <i class="fas fa-chevron-right scope-expand-icon" style="font-size:0.65rem; color:var(--text-muted); margin-top:5px; flex-shrink:0; transition:transform 0.2s;"></i>
                  <div style="flex:1; min-width:0;">
                    <div style="font-size:0.8rem; font-weight:700; color:var(--text-primary); display:flex; align-items:center; gap:5px; flex-wrap:wrap; line-height:1.4;">
                      <i class="fas fa-folder-open" style="color:var(--primary); font-size:0.7rem; flex-shrink:0;"></i>
                      <span style="word-break:break-word;">${s.room}</span>
                    </div>
                    <div style="font-size:0.78rem; color:var(--primary); font-weight:600; margin-top:2px; word-break:break-word; line-height:1.4;">↳ ${s.item}</div>
                    <div style="font-size:0.65rem; color:var(--text-muted); margin-top:3px;">${sourceInfoHtml}</div>
                  </div>
                  <div style="display:flex; flex-direction:column; align-items:flex-end; gap:4px; flex-shrink:0;">
                    <span style="font-size:0.68rem; font-weight:600; padding:3px 8px; border-radius:6px; white-space:nowrap; ${badgeStyle}">${statusText}</span>
                    ${canEdit ? `
                      <div style="display:flex; gap:4px;" onclick="event.stopPropagation()">
                        <button class="btn-scope-edit" data-idx="${idx}" style="background:none; border:1px solid var(--border-color); padding:4px 8px; border-radius:6px; color:var(--primary); cursor:pointer; font-size:0.75rem;" title="Sửa hạng mục"><i class="fas fa-edit"></i></button>
                        <button class="btn-scope-delete" data-idx="${idx}" style="background:none; border:1px solid var(--border-color); padding:4px 8px; border-radius:6px; color:var(--status-rejected); cursor:pointer; font-size:0.75rem;" title="Xóa hạng mục"><i class="fas fa-trash-alt"></i></button>
                      </div>
                    ` : ''}
                  </div>
                </div>

                <!-- Expandable subtask list (hidden by default) -->
                <div class="scope-subtask-panel" style="display:none; border-top:1px solid var(--border-color); padding:10px 12px; background:rgba(0,0,0,0.1);">
                  <div style="font-size:0.72rem; font-weight:700; color:var(--text-secondary); margin-bottom:8px; display:flex; align-items:center; gap:5px;">
                    <i class="fas fa-list-ul"></i> Danh sách công việc (${totalTasks} việc · ${doneTasks} xong)
                  </div>
                  <div style="display:flex; flex-direction:column; gap:6px;">
                    ${subtaskRowsHtml}
                  </div>
                </div>
              </div>
            `;
          }).join('');

      const canAdd = isManagementRole && !proj.isCompleted;
      return `
        <div id="scope-manager-section" style="margin-top:8px;">
          <h5 style="font-family:var(--font-title); font-size:0.9rem; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center; color:var(--primary);">
            <span><i class="fas fa-list-check"></i> Hạng mục thi công (${scopeItems.length} hạng mục)</span>
            ${canAdd ? `<button id="btn-scope-add-new" style="background:linear-gradient(135deg, var(--primary), #9E815B); color:var(--bg-primary); border:none; font-size:0.72rem; padding:6px 12px; border-radius:8px; cursor:pointer; font-weight:700; display:flex; align-items:center; gap:4px; box-shadow:var(--shadow-sm);"><i class="fas fa-plus"></i> THÊM HẠNG MỤC</button>` : ''}
          </h5>

          <!-- Add / Edit form (hidden by default) -->
          <div id="scope-inline-form" style="display:none; background:rgba(197,168,128,0.07); border:1px dashed rgba(197,168,128,0.4); border-radius:12px; padding:12px; margin-bottom:10px;">
            <div style="font-size:0.75rem; font-weight:700; color:var(--primary); margin-bottom:8px;" id="scope-form-title">Thêm hạng mục mới</div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:8px;">
              <div>
                <label class="form-label" style="font-size:0.72rem; margin-bottom:4px;">Phòng (Cấp 1)</label>
                <input type="text" id="scope-form-room" class="form-input" placeholder="VD: Phòng ngủ, Phòng bếp..." style="height:34px; font-size:0.78rem; padding-left:10px;">
              </div>
              <div>
                <label class="form-label" style="font-size:0.72rem; margin-bottom:4px;">Nội thất (Cấp 2)</label>
                <input type="text" id="scope-form-item" class="form-input" placeholder="VD: Tủ áo, Bếp trên..." style="height:34px; font-size:0.78rem; padding-left:10px;">
              </div>
            </div>
            <div style="display:flex; gap:8px;">
              <button id="scope-form-save" class="btn-primary" style="height:34px; font-size:0.78rem; flex:1;">Lưu</button>
              <button id="scope-form-cancel" style="height:34px; font-size:0.78rem; flex:1; background:rgba(255,255,255,0.05); border:1px solid var(--border-color); border-radius:8px; color:var(--text-secondary); cursor:pointer;">Huỷ</button>
            </div>
          </div>

          <!-- Items list -->
          <div id="scope-items-list" style="display:flex; flex-direction:column; gap:8px;">
            ${itemsHtml}
          </div>
        </div>
      `;
    };


    const scopeManagerHtml = buildScopeManagerHtml(project);
    const html = `
      <div style="display:flex; flex-direction:column; gap:20px;">
        <div style="border-bottom:1px solid var(--border-color); padding-bottom:12px;">
          <h4 style="font-family:var(--font-title); font-size:1.15rem; color:var(--text-primary);">${project.name}</h4>
          
          <!-- Visual Stepper: completed steps are filled -->
          <div style="margin: 12px 0 16px 0;">
            <label class="form-label" style="font-size:0.75rem; margin-bottom:8px; display:block;">Trình tự các giai đoạn (4 Giai đoạn):</label>
            <div class="stepper-scroll-container" style="display:flex; gap:8px; overflow-x:auto; padding-bottom:8px; scroll-behavior:smooth; -webkit-overflow-scrolling:touch; scroll-snap-type:x mandatory;">
              ${STEPS.map((s, idx) => {
      const isCompleted = s.num < project.step;
      const isCurrent = s.num === project.step;

      let bg = 'rgba(255,255,255,0.02)';
      let border = '1px solid var(--border-color)';
      let color = 'var(--text-muted)';
      let icon = s.num;

      if (isCompleted) {
        bg = 'rgba(78, 141, 124, 0.15)'; // Sage fill
        border = '1px solid var(--status-approved)';
        color = 'var(--status-approved)';
        icon = '<i class="fas fa-check-circle"></i>';
      } else if (isCurrent) {
        bg = 'var(--primary)'; // Gold active fill
        border = '1px solid var(--primary)';
        color = 'var(--bg-primary)';
        icon = `<span style="font-weight:bold;">${s.num}</span>`;
      }

      return `
                  <div class="stepper-item-card ${isCurrent ? 'stepper-item-active' : ''}" style="flex:0 0 110px; display:flex; flex-direction:column; align-items:center; text-align:center; background-color:${bg}; border:${border}; border-radius:12px; padding:10px 8px; transition:all 0.3s; scroll-snap-align:start;">
                    <div style="width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:0.75rem; color:${isCurrent ? 'var(--bg-primary)' : color}; margin-bottom:6px;">
                      ${icon}
                    </div>
                    <span style="font-size:0.65rem; font-weight:${isCurrent ? '700' : '500'}; color:${isCurrent ? 'var(--text-primary)' : color}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; width:100%;" title="${s.title}">${s.title}</span>
                  </div>
                `;
    }).join('')}
            </div>
          </div>

          <p style="font-size:0.8rem; color:var(--text-secondary); margin-top:4px;">
            Hạn deadline: <span style="font-weight:700; font-size:0.78rem; padding:2px 8px; border-radius:6px; background-color:rgba(197, 168, 128, 0.12); border:1px solid rgba(197, 168, 128, 0.3); color:var(--primary);">${project.deadline}</span> 
            (Hạn gốc: ${project.originalDeadline})
          </p>
        </div>

        <!-- System state & action buttons -->
        <div style="display:flex; flex-direction:column; gap:8px;">
          ${isManagementRole && project.step < 4 && nextStepInfo
            ? `
              <button class="btn-primary" id="drawer-btn-advance" style="padding:12px 16px; font-size:0.88rem; width:100%; display:flex; flex-direction:column; align-items:center; gap:2px; height:auto; line-height:1.3; background:linear-gradient(135deg, #4F46E5, #4338CA); color:white; border:none; border-radius:12px; font-weight:700; cursor:pointer;">
                <span style="font-weight:700;"><i class="fas fa-step-forward"></i> Phê Duyệt Sang Giai Đoạn Tiếp Theo</span>
                <span style="font-size:0.7rem; opacity:0.85; font-weight:normal;">Lên: GĐ ${nextStepInfo.num} - ${nextStepInfo.title}</span>
              </button>
            `
            : ''
          }
          ${isManagementRole && project.step === 4 && !project.isCompleted
            ? `
              <button class="btn-primary" id="drawer-btn-complete-project" style="padding:14px; font-size:0.9rem; font-weight:700; width:100%; background:linear-gradient(135deg, #10B981, #047857); color:#FFF; display:flex; align-items:center; justify-content:center; gap:6px; border:none; border-radius:12px; cursor:pointer; box-shadow:0 4px 12px rgba(16,185,129,0.25);">
                <i class="fas fa-check-double"></i> Hoàn Thành Công Trình
              </button>
            `
            : ''
          }
          ${!project.isCompleted
            ? `
              <button class="btn-action" id="drawer-btn-rework" style="padding:12px; font-size:0.8rem; background:linear-gradient(135deg, #EF4444, #B91C1C); color:white; border:none; border-radius:12px; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:4px; height:auto; line-height:1.2; width:100%; margin-bottom:8px;"><i class="fas fa-exclamation-triangle"></i> Báo Hàng Lỗi</button>
              <button class="btn-action" id="drawer-btn-scope" style="padding:12px; font-size:0.8rem; background:linear-gradient(135deg, #F59E0B, #D97706); color:white; border:none; border-radius:12px; font-weight:700; cursor:pointer; width:100%; display:flex; align-items:center; justify-content:center; gap:4px; height:auto; line-height:1.2;"><i class="fas fa-plus-circle"></i> Báo Phát Sinh Hạng Mục</button>
            `
            : ''
          }
          ${isManagementRole && project.isCompleted
            ? `
              <div style="background-color:rgba(78, 141, 124, 0.15); border:1px solid var(--status-approved); color:var(--status-approved); padding:12px; border-radius:12px; font-size:0.85rem; font-weight:600; width:100%; text-align:center; margin-bottom:8px;">
                <i class="fas fa-check-double"></i> Dự án này đã hoàn thành toàn bộ và lưu trữ
              </div>
              <button class="btn-primary" id="drawer-btn-export-excel" style="padding:14px; font-size:0.9rem; font-weight:700; width:100%; background:linear-gradient(135deg, #10B981, #047857); color:#FFF; display:flex; align-items:center; justify-content:center; gap:6px; border:none; border-radius:12px; cursor:pointer;">
                <i class="fas fa-file-excel"></i> Xuất Báo Cáo Excel (.CSV)
              </button>
            `
            : ''
          }
        </div>

        <!-- Scope Manager: Add/Edit/Delete scope items -->
        ${scopeManagerHtml}

        <!-- Project Assignees (Người phụ trách) -->
        <div>
          <h5 style="font-family:var(--font-title); font-size:0.9rem; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
            <span>Nhân sự phụ trách công trình</span>
            ${(user.role === 'manager' || user.role === 'kts' || user.role === 'sales') && !project.isCompleted
              ? `<button id="drawer-assign-project-btn" style="background:linear-gradient(135deg, var(--primary), #9E815B); color:var(--bg-primary); border:none; font-size:0.72rem; padding:6px 12px; border-radius:8px; cursor:pointer; font-weight:700; display:flex; align-items:center; gap:4px; box-shadow:var(--shadow-sm);"><i class="fas fa-user-plus"></i> GIAO CÔNG TRÌNH</button>`
              : ''
            }
          </h5>
          <div style="background-color:rgba(0,0,0,0.15); border-radius:12px; padding:12px; border:1px solid var(--border-color); display:flex; flex-wrap:wrap; gap:8px;" id="project-assignees-list">
            ${project.assignees && project.assignees.length > 0
              ? project.assignees.map(uId => {
                  const assignedUser = DB.load().users.find(u => u.id === uId);
                  if (!assignedUser) return '';
                  const roleLabel = assignedUser.role === 'lead_worker' ? 'Thợ chính' : 'Thợ phụ';
                  return `
                    <div style="display:flex; align-items:center; gap:6px; background-color:var(--bg-secondary); border:1px solid var(--border-color); padding:6px 10px; border-radius:20px; font-size:0.75rem;">
                      <img src="${assignedUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}" style="width:20px; height:20px; border-radius:50%; object-fit:cover;">
                      <span><strong>${assignedUser.name}</strong> (${roleLabel})</span>
                    </div>
                  `;
                }).join('')
              : '<p style="font-size:0.75rem; color:var(--text-muted); width:100%; margin:0; text-align:center;">Chưa gán nhân sự phụ trách công trình.</p>'
            }
          </div>
        </div>

        <!-- Subtasks summary -->
        <div>
          <h5 style="font-family:var(--font-title); font-size:0.9rem; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
            <span>Nhiệm Vụ Công Việc (${project.subtasks.filter(s => s.status === 'completed').length}/${project.subtasks.length})</span>
            ${!project.isCompleted
        ? `<button id="drawer-add-task-btn" style="background:linear-gradient(135deg, var(--primary), #9E815B); color:var(--bg-primary); border:none; font-size:0.72rem; padding:6px 12px; border-radius:8px; cursor:pointer; font-weight:700; display:flex; align-items:center; gap:4px; box-shadow:var(--shadow-sm);"><i class="fas fa-plus"></i> GIAO VIỆC</button>`
        : ''
      }
          </h5>
          
          <div style="background-color:rgba(0,0,0,0.15); border-radius:12px; padding:12px; border:1px solid var(--border-color); display:flex; flex-direction:column; gap:10px;">
            ${project.subtasks.map(st => {
        const assignedUser = DB.load().users.find(u => u.id === st.assignedTo);
        const compTimeText = st.status === 'completed' && st.completedAt
          ? `<div style="font-size:0.7rem; color:var(--status-approved); font-weight:500; margin-top:2px;"><i class="fas fa-clock"></i> Xong lúc: ${new Date(st.completedAt).toLocaleTimeString('vi-VN')} - ${new Date(st.completedAt).toLocaleDateString('vi-VN')}</div>`
          : '';
        return `
                <div style="background-color:var(--bg-secondary); border:1px solid var(--border-color); border-radius:10px; padding:10px 12px; display:flex; justify-content:space-between; align-items:center; gap:12px; box-shadow:var(--shadow-sm); width:100%; box-sizing:border-box;">
                  <div style="flex:1; display:flex; flex-direction:column;">
                    <span style="font-size:0.82rem; font-weight:600; text-decoration: ${st.status === 'completed' ? 'line-through' : 'none'}; color: ${st.status === 'completed' ? 'var(--text-muted)' : 'var(--text-primary)'}; line-height:1.4;">
                      ${st.type === 'rework' ? '<span style="color:var(--status-rejected); font-weight:700;">[SỬA LỖI]</span> ' : ''}
                      ${st.type === 'small_scope' ? '<span style="color:var(--status-pending); font-weight:700;">[PHÁT SINH]</span> ' : ''}
                      ${st.title}
                    </span>
                    <div style="font-size:0.7rem; color:var(--text-muted); margin-top:2px;">Người làm: <strong>${assignedUser ? assignedUser.name : 'Chưa giao'}</strong></div>
                    ${compTimeText}
                  </div>
                  <div style="display:flex; align-items:center; gap:8px;">
                    ${st.status === 'pending' && !project.isCompleted
                      ? `<button class="btn-drawer-complete-task" data-task="${st.id}" style="background-color:rgba(78, 141, 124, 0.12); border:1px solid rgba(78,141,124,0.25); color:var(--status-approved); padding:6px 12px; border-radius:6px; font-size:0.75rem; font-weight:700; cursor:pointer; height:auto; margin-right:4px;">Xong</button>`
                      : st.status === 'pending'
                        ? '<span style="color:var(--text-muted); font-size:0.75rem; font-weight:500; margin-right:4px;">Chưa làm</span>'
                        : '<span style="color:var(--status-approved); font-weight:700; font-size:0.75rem; white-space:nowrap; margin-right:4px;"><i class="fas fa-check-double"></i> Đã xong</span>'
                    }
                    ${(user.role === 'manager' || user.role === 'kts' || user.role === 'sales') && !project.isCompleted ? `
                      <button class="btn-edit-subtask" data-task="${st.id}" style="background:none; border:none; padding:4px; color:var(--primary); cursor:pointer;" title="Sửa nhiệm vụ"><i class="fas fa-edit"></i></button>
                      <button class="btn-delete-subtask" data-task="${st.id}" style="background:none; border:none; padding:4px; color:var(--status-rejected); cursor:pointer;" title="Xóa nhiệm vụ"><i class="fas fa-trash-alt"></i></button>
                    ` : ''}
                  </div>
                </div>
              `;
      }).join('')}
            ${project.subtasks.length === 0 ? '<p style="text-align:center; font-size:0.75rem; color:var(--text-muted);">Không có nhiệm vụ con nào.</p>' : ''}
          </div>
        </div>

        <div>
          <h5 style="font-family:var(--font-title); font-size:0.9rem; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
            <span>Lịch Sử Báo Cáo Hàng Ngày (${project.dailyLogs.filter(l => l.approved !== false).length})</span>
            ${user.role === 'manager' && !project.isCompleted
              ? `<button id="drawer-add-log-btn" style="background:linear-gradient(135deg, var(--primary), #9E815B); color:var(--bg-primary); border:none; font-size:0.72rem; padding:6px 12px; border-radius:8px; cursor:pointer; font-weight:700; display:flex; align-items:center; gap:4px; box-shadow:var(--shadow-sm);"><i class="fas fa-plus"></i> THÊM BÁO CÁO</button>`
              : ''
            }
          </h5>
          <div style="display:flex; flex-direction:column; gap:10px;" id="drawer-timeline-container">
            ${project.dailyLogs.filter(l => l.approved !== false).map((l, idx) => {
              const roleDisplay = l.reporterRole === 'lead_worker' ? 'Thợ chính' : l.reporterRole === 'assistant_worker' ? 'Thợ phụ' : l.reporterRole === 'kts' ? 'Thiết kế' : l.reporterRole === 'sales' ? 'Sale' : l.reporterRole === 'manager' ? 'Sếp' : 'Khác';
              const actualIdx = project.dailyLogs.findIndex(dl => dl.id === l.id);
              return `
                <div style="background-color:rgba(0,0,0,0.15); border:1px solid var(--border-color); border-radius:10px; padding:10px 12px; display:flex; justify-content:space-between; align-items:center; gap:8px; width:100%; box-sizing:border-box;">
                  <div class="btn-view-log-item" data-log-index="${actualIdx}" style="cursor:pointer; display:flex; align-items:center; gap:10px; flex:1;">
                    <div style="width:8px; height:8px; border-radius:50%; background-color:${l.status === 'on_track' ? 'var(--status-approved)' : 'var(--status-rejected)'}; flex-shrink:0;"></div>
                    <div>
                      <div style="font-size:0.85rem; font-weight:600;">${l.date} - ${l.reporterName}</div>
                      <div style="font-size:0.75rem; color:var(--text-muted); text-overflow:ellipsis; overflow:hidden; white-space:nowrap; max-width:200px;">${roleDisplay} • ${l.note}</div>
                    </div>
                  </div>
                  <div style="display:flex; align-items:center; gap:8px;">
                    <div class="btn-view-log-item" data-log-index="${actualIdx}" style="font-size:0.75rem; color:var(--primary); font-weight:600; cursor:pointer;">Xem &rarr;</div>
                    ${user.role === 'manager' ? `
                      <button class="btn-delete-log-item" data-log-id="${l.id}" style="background:none; border:none; padding:4px; color:var(--status-rejected); cursor:pointer;" title="Xóa báo cáo"><i class="fas fa-trash-alt"></i></button>
                    ` : ''}
                  </div>
                </div>
              `;
            }).join('')}
            ${project.dailyLogs.filter(l => l.approved !== false).length === 0 ? '<p style="text-align:center; font-size:0.75rem; color:var(--text-muted);">Chưa có nhật ký cuối ngày nào được gửi.</p>' : ''}
          </div>
        </div>

        <!-- Project History Logs -->
        <div>
          <h5 style="font-family:var(--font-title); font-size:0.9rem; margin-bottom:8px;">Nhật Ký Hệ Thống</h5>
          <div style="background-color: var(--bg-primary); border-radius:12px; padding:12px; font-size:0.75rem; color:var(--text-secondary); display:flex; flex-direction:column; gap:8px; max-height:150px; overflow-y:auto; border:1px solid var(--border-color);">
            ${project.history.map(h => `
              <div>
                <span style="color:var(--text-muted);">${new Date(h.timestamp).toLocaleTimeString('vi-VN')}</span> • 
                <strong>${h.action}</strong> 
                <span style="color:var(--primary);">(${h.user})</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    const drawer = Modal.create('Chi Tiết Dự Án & Quản Lý', html);

    // Auto-scroll stepper container to current step card
    setTimeout(() => {
      const container = drawer.element.querySelector('.stepper-scroll-container');
      const activeCard = drawer.element.querySelector('.stepper-item-active');
      if (container && activeCard) {
        const offset = activeCard.offsetLeft - (container.clientWidth / 2) + (activeCard.clientWidth / 2);
        container.scrollTo({ left: offset, behavior: 'smooth' });
      }
    }, 120);

    // ── SCOPE MANAGER BINDINGS ──────────────────────────────────────────
    const bindScopeManager = () => {
      const section = drawer.element.querySelector('#scope-manager-section');
      if (!section) return;

      let editingIdx = null; // null = adding new, number = editing existing

      const showForm = (title, roomVal = '', itemVal = '') => {
        const form = section.querySelector('#scope-inline-form');
        section.querySelector('#scope-form-title').textContent = title;
        section.querySelector('#scope-form-room').value = roomVal;
        section.querySelector('#scope-form-item').value = itemVal;
        form.style.display = 'block';
        section.querySelector('#scope-form-room').focus();
      };

      const hideForm = () => {
        const form = section.querySelector('#scope-inline-form');
        form.style.display = 'none';
        editingIdx = null;
      };

      const refreshScopeList = () => {
        const updatedProject = DB.getProject(projectId);
        const tmpDiv = document.createElement('div');
        tmpDiv.innerHTML = buildScopeManagerHtml(updatedProject);
        const newSection = tmpDiv.querySelector('#scope-manager-section');
        section.replaceWith(newSection);
        bindScopeManager(); // re-bind on new DOM
      };

      // Button: "+ THÊM HẠNG MỤC"
      const btnAdd = section.querySelector('#btn-scope-add-new');
      if (btnAdd) {
        btnAdd.addEventListener('click', () => {
          editingIdx = null;
          showForm('Thêm hạng mục mới');
        });
      }

      // Button: Huỷ form
      section.querySelector('#scope-form-cancel')?.addEventListener('click', hideForm);

      // Button: Lưu form
      section.querySelector('#scope-form-save')?.addEventListener('click', () => {
        const room = section.querySelector('#scope-form-room').value.trim();
        const item = section.querySelector('#scope-form-item').value.trim();
        if (!room || !item) { Toast.error('Vui lòng điền đầy đủ Phòng và Nội thất.'); return; }

        if (editingIdx === null) {
          DB.addScopeItem(projectId, room, item, user.id);
          Toast.success(`Đã thêm hạng mục: [${room}] - ${item}`);
        } else {
          DB.editScopeItem(projectId, editingIdx, room, item, user.id);
          Toast.success('Đã cập nhật hạng mục.');
        }
        hideForm();
        refreshScopeList();
        if (onUpdate) onUpdate();
      });

      // Buttons: Sửa từng dòng
      section.querySelectorAll('.btn-scope-edit').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.getAttribute('data-idx'));
          const proj = DB.getProject(projectId);
          const s = proj.scope[idx];
          if (!s) return;
          editingIdx = idx;
          showForm(`Sửa hạng mục #${idx + 1}`, s.room, s.item);
        });
      });

      // Buttons: Xóa từng dòng
      section.querySelectorAll('.btn-scope-delete').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.getAttribute('data-idx'));
          const proj = DB.getProject(projectId);
          const s = proj.scope[idx];
          if (!s) return;
          if (confirm(`Xóa hạng mục "[${s.room}] - ${s.item}"?\nHành động này không thể hoàn tác.`)) {
            DB.deleteScopeItem(projectId, idx, user.id);
            Toast.success('Đã xóa hạng mục.');
            refreshScopeList();
            if (onUpdate) onUpdate();
          }
        });
      });

      // Accordion: click header to toggle subtask panel
      section.querySelectorAll('.scope-item-header').forEach(header => {
        header.addEventListener('click', () => {
          const card = header.closest('[data-scope-idx]');
          const panel = card.querySelector('.scope-subtask-panel');
          const icon = header.querySelector('.scope-expand-icon');
          if (!panel) return;
          const isOpen = panel.style.display !== 'none';
          panel.style.display = isOpen ? 'none' : 'block';
          if (icon) icon.style.transform = isOpen ? 'none' : 'rotate(90deg)';
        });
      });
    };

    bindScopeManager();
    // ── END SCOPE MANAGER BINDINGS ──────────────────────────────────────

    // Bind timeline log clicks to detail view modal
    const timelineContainer = drawer.element.querySelector('#drawer-timeline-container');
    if (timelineContainer) {
      // View log detail click
      timelineContainer.querySelectorAll('.btn-view-log-item').forEach(item => {
        item.addEventListener('click', () => {
          const logIndex = parseInt(item.getAttribute('data-log-index'));
          const log = project.dailyLogs[logIndex];
          if (log) {
            this.openLogDetailModal(log, project);
          }
        });
      });

      // Delete log item click
      timelineContainer.querySelectorAll('.btn-delete-log-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const logId = btn.getAttribute('data-log-id');
          if (confirm('Bạn có chắc chắn muốn XÓA BÁO CÁO này không?\nHành động này không thể khôi phục!')) {
            DB.deleteDailyLog(projectId, logId, user.id);
            Toast.success('Đã xóa báo cáo thi công.');
            drawer.close();
            onUpdate();
          }
        });
      });
    }

    // Add daily log on behalf of manager click
    const btnAddLog = document.getElementById('drawer-add-log-btn');
    if (btnAddLog) {
      btnAddLog.addEventListener('click', () => {
        this.openManagerAddLogModal(projectId, user, () => {
          drawer.close();
          onUpdate();
        });
      });
    }



    // Rework click
    const btnRework = document.getElementById('drawer-btn-rework');
    if (btnRework) {
      btnRework.addEventListener('click', () => {
        this.openReworkModal(projectId, user, () => {
          drawer.close();
          onUpdate();
        });
      });
    }

    // Scope click
    const btnScope = document.getElementById('drawer-btn-scope');
    if (btnScope) {
      btnScope.addEventListener('click', () => {
        this.openScopeModal(projectId, user, () => {
          drawer.close();
          onUpdate();
        });
      });
    }

    // Step progression click
    const btnAdvance = document.getElementById('drawer-btn-advance');
    if (btnAdvance) {
      btnAdvance.addEventListener('click', () => {
        try {
          const prj = DB.advanceProject(projectId, user.id);
          if (prj) {
            Toast.success('Đã duyệt chuyển giai đoạn thành công!');
            drawer.close();
            onUpdate();
          }
        } catch (err) {
          Toast.error(err.message);
        }
      });
    }

    drawer.element.querySelectorAll('.btn-drawer-complete-task').forEach(btn => {
      btn.addEventListener('click', () => {
        const taskId = btn.getAttribute('data-task');
        DB.completeSubtask(projectId, taskId, user.id);
        Toast.success('Đã hoàn thành nhiệm vụ.');
        drawer.close();
        onUpdate();
      });
    });

    // Edit subtask
    drawer.element.querySelectorAll('.btn-edit-subtask').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const taskId = btn.getAttribute('data-task');
        this.openEditSubtaskModal(projectId, taskId, user, () => {
          drawer.close();
          onUpdate();
        });
      });
    });

    // Delete subtask
    drawer.element.querySelectorAll('.btn-delete-subtask').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const taskId = btn.getAttribute('data-task');
        if (confirm('Bạn có chắc chắn muốn xóa nhiệm vụ này?')) {
          DB.deleteSubtask(projectId, taskId, user.id);
          Toast.success('Đã xóa nhiệm vụ.');
          drawer.close();
          onUpdate();
        }
      });
    });

    // Complete project entire click
    const btnCompleteProject = document.getElementById('drawer-btn-complete-project');
    if (btnCompleteProject) {
      btnCompleteProject.addEventListener('click', () => {
        if (confirm('Bạn có chắc chắn muốn xác nhận hoàn thành toàn bộ công trình này và chuyển vào kho Lưu trữ?')) {
          DB.completeProject(projectId, user.id);
          Toast.success(`Chúc mừng! Công trình đã chính thức hoàn thành.`);
          drawer.close();
          onUpdate();
        }
      });
    }

    // Export Excel click
    const btnExportExcel = document.getElementById('drawer-btn-export-excel');
    if (btnExportExcel) {
      btnExportExcel.addEventListener('click', () => {
        this.exportProjectToExcel(projectId);
      });
    }

    // Add subtask within drawer modal
    const btnAddTask = document.getElementById('drawer-add-task-btn');
    if (btnAddTask) {
      btnAddTask.addEventListener('click', () => {
        this.openAssignTaskModal(projectId, user, () => {
          drawer.close();
          onUpdate();
        });
      });
    }

    // Assign project owners click
    const btnAssignProject = document.getElementById('drawer-assign-project-btn');
    if (btnAssignProject) {
      btnAssignProject.addEventListener('click', () => {
        this.openAssignProjectOwnersModal(projectId, user, () => {
          drawer.close();
          onUpdate();
          setTimeout(() => {
            this.openProjectDetailsDrawer(projectId, user, onUpdate);
          }, 100);
        });
      });
    }
  },

  // 9.2 OPEN EDIT PROJECT ASSIGNEES MODAL
  openAssignProjectOwnersModal(projectId, user, onComplete) {
    const db = DB.load();
    const project = db.projects.find(p => p.id === projectId);
    if (!project) return;

    // Filter workers (lead and assistant workers)
    const workers = db.users.filter(u => u.role === 'lead_worker' || u.role === 'assistant_worker');
    const currentAssignees = project.assignees || [];

    const html = `
      <form id="assign-project-owners-form" style="display:flex; flex-direction:column; gap:16px;">
        <div style="border-bottom:1px solid var(--border-color); padding-bottom:8px;">
          <h4 style="font-family:var(--font-title); font-size:1rem; color:var(--text-primary);"><i class="fas fa-user-check"></i> Giao Nhân Sự Phụ Trách</h4>
          <p style="font-size:0.75rem; color:var(--text-secondary); margin-top:2px;">Công trình: <strong>${project.name}</strong></p>
        </div>

        <div style="max-height: 280px; overflow-y: auto; display:flex; flex-direction:column; gap:10px; padding:4px;">
          ${workers.map(w => {
            const isChecked = currentAssignees.includes(w.id);
            const roleLabel = w.role === 'lead_worker' ? 'Thợ chính' : 'Thợ phụ';
            return `
              <label style="display:flex; align-items:center; justify-content:space-between; background:rgba(255, 255, 255, 0.02); border:1px solid var(--border-color); padding:10px 14px; border-radius:12px; cursor:pointer; transition:background-color var(--transition-fast);" onmouseover="this.style.backgroundColor='rgba(255,255,255,0.01)'" onmouseout="this.style.backgroundColor='transparent'">
                <div style="display:flex; align-items:center; gap:10px;">
                  <img src="${w.avatar}" style="width:28px; height:28px; border-radius:50%; object-fit:cover;">
                  <div>
                    <div style="font-size:0.85rem; font-weight:600; color:var(--text-primary);">${w.name}</div>
                    <div style="font-size:0.7rem; color:var(--text-muted);">${roleLabel}</div>
                  </div>
                </div>
                <input type="checkbox" name="project-assignee" value="${w.id}" ${isChecked ? 'checked' : ''} style="width:18px; height:18px; accent-color:var(--primary);">
              </label>
            `;
          }).join('')}
        </div>

        <div style="display:flex; gap:12px; margin-top:12px;">
          <button type="button" class="btn-secondary modal-close-btn" style="flex:1;">Hủy bỏ</button>
          <button type="submit" class="btn-primary" style="flex:1;">Lưu thay đổi</button>
        </div>
      </form>
    `;

    const modal = Modal.create('Giao Công Trình', html);

    document.getElementById('assign-project-owners-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const selectedCheckboxes = document.querySelectorAll('input[name="project-assignee"]:checked');
      const selectedIds = Array.from(selectedCheckboxes).map(cb => cb.value);

      // Save to DB
      const loadedDb = DB.load();
      const prj = loadedDb.projects.find(p => p.id === projectId);
      if (prj) {
        prj.assignees = selectedIds;
        
        // Add project history action
        const namesStr = selectedIds.map(id => {
          const u = loadedDb.users.find(usr => usr.id === id);
          return u ? u.name : id;
        }).join(', ') || 'Không có ai';

        const hist = {
          timestamp: new Date().toISOString(),
          action: `Cập nhật nhân sự phụ trách công trình: [${namesStr}]`,
          user: user.name
        };
        prj.history.push(hist);

        DB.save(loadedDb);
        DB.sbUpdateProject(prj.id, { assignees: prj.assignees });
        DB.sbInsertHistory(hist, prj.id);
        Toast.success('Cập nhật nhân sự phụ trách công trình thành công!');
        modal.close();
        onComplete();
      }
    });

    modal.element.querySelectorAll('.modal-close-btn').forEach(btn => {
      btn.addEventListener('click', () => modal.close());
    });
  },

  // 9.1 OPEN INDIVIDUAL DAILY LOG DETAILS MODAL
  openLogDetailModal(log, project) {
    const roleDisplay = log.reporterRole === 'lead_worker' ? 'Thợ chính' : log.reporterRole === 'assistant_worker' ? 'Thợ phụ' : log.reporterRole === 'kts' ? 'Thiết kế' : log.reporterRole === 'sales' ? 'Sale' : 'Khác';

    const html = `
      <div style="display:flex; flex-direction:column; gap:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color); padding-bottom:12px;">
          <div>
            <h4 style="font-family:var(--font-title); font-size:1.1rem; color:var(--text-primary);">Chi Tiết Báo Cáo Ngày: ${log.date}</h4>
            <p style="font-size:0.8rem; color:var(--text-secondary); margin-top:2px;">
              Người gửi: <strong>${log.reporterName}</strong> (${roleDisplay}) ${log.approvedBy ? ` | Duyệt bởi: <strong>${log.approvedBy}</strong>` : ''}
            </p>
          </div>
          <span class="status-badge ${log.status === 'on_track' ? 'approved' : 'rejected'}" style="font-weight:600; padding:6px 12px;">
            ${log.status === 'on_track' ? 'Đúng tiến độ' : 'Bị chậm'}
          </span>
        </div>

        ${log.items && log.items.length > 0 ? `
          <div>
            <label class="form-label" style="font-size:0.75rem; margin-bottom:8px;">Hạng mục chi tiết báo cáo</label>
            <div style="display:flex; flex-direction:column; gap:8px;">
              ${log.items.map(it => {
                const statusColor = it.isCompleted ? 'var(--status-approved)' : 'var(--status-pending)';
                const statusIcon = it.isCompleted ? '<i class="fas fa-check-circle"></i>' : '<i class="fas fa-exclamation-triangle"></i>';
                return `
                  <div style="background: linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%); border: 1px solid rgba(255, 255, 255, 0.06); border-left: 3px solid ${it.isCompleted ? 'var(--status-approved)' : 'var(--status-pending)'}; border-radius:10px; padding:10px 14px; display:flex; flex-direction:column; gap:4px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                      <span style="font-size:0.85rem; font-weight:700; color:var(--text-primary);">
                        ${it.room} ➔ <span style="color:var(--primary);">${it.item}</span>
                      </span>
                      <span style="font-size:0.75rem; font-weight:600; color:${statusColor}; display:flex; align-items:center; gap:4px;">
                        ${statusIcon} ${it.isCompleted ? 'Đã xong' : 'Chưa xong'}
                      </span>
                    </div>
                    ${!it.isCompleted ? `
                      <div style="font-size:0.75rem; color:var(--status-pending); background:rgba(210, 144, 98, 0.05); border:1px dashed rgba(210, 144, 98, 0.2); padding:6px 10px; border-radius:6px; margin-top:4px;">
                        <strong>Việc cần làm:</strong> ${it.pendingNotes}
                      </div>
                    ` : ''}
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        ` : `
          <div>
            <label class="form-label" style="font-size:0.75rem;">Nội dung ghi chú báo cáo</label>
            <div style="background-color: var(--bg-primary); border:1px solid var(--border-color); border-radius:10px; padding:12px; font-size:0.85rem; color:var(--text-primary); line-height:1.5; white-space:pre-wrap;">${log.note}</div>
          </div>
        `}

        ${log.expectedCompletionDate ? `
          <div>
            <label class="form-label" style="font-size:0.75rem;">Thời gian hoàn thành dự kiến</label>
            <div style="background-color: rgba(197, 168, 128, 0.12); border:1px solid rgba(197, 168, 128, 0.3); border-radius:10px; padding:10px 12px; font-size:0.85rem; font-weight:600; color:var(--primary); width:max-content; display:flex; align-items:center; gap:6px;">
              <i class="fas fa-calendar-alt"></i> ${new Date(log.expectedCompletionDate).toLocaleDateString('vi-VN')}
            </div>
          </div>
        ` : ''}

        ${log.photos && log.photos.length > 0 ? `
          <div>
            <label class="form-label" style="font-size:0.75rem; margin-bottom:8px;">Hình ảnh thực tế đính kèm (${log.photos.length} ảnh)</label>
            <div class="report-photos-grid" style="grid-template-columns: repeat(3, 1fr);">
              ${log.photos.map(pUrl => `
                <div style="aspect-ratio:4/3; border-radius:8px; overflow:hidden; border:1px solid var(--border-color); cursor:zoom-in;">
                  <img src="${pUrl}" style="width:100%; height:100%; object-fit:cover;" onclick="window.open('${pUrl}', '_blank')">
                </div>
              `).join('')}
            </div>
          </div>
        ` : `
          <div>
            <label class="form-label" style="font-size:0.75rem;">Hình ảnh thực tế</label>
            <p style="font-size:0.8rem; color:var(--text-muted);">Không đính kèm hình ảnh.</p>
          </div>
        `}
      </div>
    `;

    Modal.create('Chi Tiết Nhật Ký Báo Cáo', html);
  },

  openEditLogModal(project, log, user, onUpdate) {
    const isWorker = log.items && log.items.length > 0;
    let currentPhotos = [...(log.photos || [])];
    const db = DB.load();
    const leadWorkers = db.users.filter(u => u.role === 'lead_worker');

    const html = `
      <form id="edit-log-form" style="display:flex; flex-direction:column; gap:16px; max-height:80vh; overflow-y:auto; padding:4px;">
        <div style="border-bottom:1px solid var(--border-color); padding-bottom:8px;">
          <h4 style="font-family:var(--font-title); font-size:1.1rem; color:var(--text-primary);"><i class="fas fa-edit"></i> Chỉnh Sửa Báo Cáo</h4>
          <p style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">Công trình: <strong>${project.name}</strong> • Ngày: ${log.date}</p>
        </div>

        ${user.role === 'assistant_worker' ? `
          <div>
            <label class="form-label">Chọn Thợ chính duyệt báo cáo hôm nay</label>
            <select id="edit-log-approver-id" class="form-select" required>
              ${leadWorkers.map(w => `<option value="${w.id}" ${log.approverId === w.id ? 'selected' : ''}>${w.name}</option>`).join('')}
              ${leadWorkers.length === 0 ? '<option value="" disabled>Không có thợ chính nào</option>' : ''}
            </select>
          </div>
        ` : ''}

        <div>
          <label class="form-label">Tình trạng tiến độ</label>
          <div style="display:flex; gap:16px; margin-top:4px;">
            <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
              <input type="radio" name="edit-log-status" value="on_track" ${log.status === 'on_track' ? 'checked' : ''} style="accent-color:var(--status-approved); width:18px; height:18px;">
              <span>Đúng tiến độ ✅</span>
            </label>
            <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
              <input type="radio" name="edit-log-status" value="delayed" ${log.status === 'delayed' ? 'checked' : ''} style="accent-color:var(--status-rejected); width:18px; height:18px;">
              <span>Bị chậm ⚠️</span>
            </label>
          </div>
        </div>

        ${isWorker ? `
          <div>
            <label class="form-label">Cập nhật hạng mục thi công</label>
            <div style="display:flex; flex-direction:column; gap:10px; margin-top:6px;" id="edit-log-items-container">
              ${log.items.map((it, idx) => `
                <div class="edit-log-item-row" data-idx="${idx}" style="background:rgba(255,255,255,0.02); border:1px solid var(--border-color); border-radius:10px; padding:10px 12px; display:flex; flex-direction:column; gap:6px;">
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:0.8rem; font-weight:700; color:var(--text-primary);">${it.room} ➔ <span style="color:var(--primary);">${it.item}</span></span>
                    <label style="display:flex; align-items:center; gap:6px; cursor:pointer; font-size:0.75rem; font-weight:600;">
                      <input type="checkbox" class="edit-chk-completed" ${it.isCompleted ? 'checked' : ''} style="width:16px; height:16px; accent-color:var(--status-approved);">
                      <span>Đã xong</span>
                    </label>
                  </div>
                  <div class="edit-pending-notes-wrapper" style="display: ${it.isCompleted ? 'none' : 'block'};">
                    <input type="text" class="edit-txt-pending-notes" value="${it.pendingNotes || ''}" class="form-input" placeholder="Việc cần làm còn lại..." style="font-size:0.75rem; height:32px; padding-left:8px; width:100%;">
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : `
          <div>
            <label class="form-label">Nội dung ghi chú báo cáo</label>
            <textarea id="edit-log-note" class="form-textarea" placeholder="Nhập nội dung báo cáo..." required style="min-height:100px;">${log.note || ''}</textarea>
          </div>
        `}

        <div>
          <label class="form-label">Thời gian xong dự kiến</label>
          <input type="date" id="edit-log-expected-completion" class="form-input" value="${log.expectedCompletionDate || ''}" required style="padding-left:14px; height:40px;">
        </div>

        <div>
          <label class="form-label">Hình ảnh thực tế đính kèm (Bắt buộc tối thiểu 1 ảnh)</label>
          <div class="photo-uploader" id="edit-log-photo-uploader" style="margin-bottom:8px;">
            <i class="fas fa-camera"></i>
            <p style="font-size:0.85rem; margin-top:4px; font-weight:500;">Bấm chụp ảnh hoặc tải thêm tệp</p>
            <input type="file" id="edit-log-photo-file-input" accept="image/*" multiple style="display:none;">
          </div>
          <div class="upload-preview-container" id="edit-log-preview-container"></div>
        </div>

        <button type="submit" class="btn-primary" style="margin-top:12px;">
          <i class="fas fa-save"></i> Lưu Thay Đổi
        </button>
      </form>
    `;

    const modal = Modal.create('Chỉnh Sửa Nhật Ký Báo Cáo', html);

    if (isWorker) {
      const rows = modal.element.querySelectorAll('.edit-log-item-row');
      rows.forEach(row => {
        const chk = row.querySelector('.edit-chk-completed');
        const wrapper = row.querySelector('.edit-pending-notes-wrapper');
        chk.addEventListener('change', () => {
          wrapper.style.display = chk.checked ? 'none' : 'block';
        });
      });
    }

    const previewContainer = modal.element.querySelector('#edit-log-preview-container');
    const uploader = modal.element.querySelector('#edit-log-photo-uploader');
    const fileInput = modal.element.querySelector('#edit-log-photo-file-input');

    const renderPreviews = () => {
      previewContainer.innerHTML = currentPhotos.map((url, idx) => `
        <div class="upload-preview-item" style="position:relative; width:80px; aspect-ratio:4/3; border-radius:8px; overflow:hidden; border:1px solid var(--border-color);">
          <img src="${url}" style="width:100%; height:100%; object-fit:cover;">
          <button type="button" class="upload-preview-remove btn-remove-edit-photo" data-idx="${idx}" style="position:absolute; top:2px; right:2px; background:rgba(0,0,0,0.6); color:white; border:none; border-radius:50%; width:20px; height:20px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:12px;">&times;</button>
        </div>
      `).join('');

      previewContainer.querySelectorAll('.btn-remove-edit-photo').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const idx = parseInt(btn.getAttribute('data-idx'));
          currentPhotos.splice(idx, 1);
          renderPreviews();
        });
      });
    };

    renderPreviews();

    uploader.addEventListener('click', () => {
      fileInput.click();
    });

    fileInput.addEventListener('change', async (e) => {
      const files = e.target.files;
      Toast.info('Đang nén và xử lý hình ảnh...');
      for (const file of files) {
        try {
          const base64Img = await this.compressImage(file);
          currentPhotos.push(base64Img);
        } catch (err) {
          console.error(err);
          Toast.error('Không thể đọc hoặc xử lý ảnh: ' + file.name);
        }
      }
      renderPreviews();
      fileInput.value = '';
    });

    modal.element.querySelector('#edit-log-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const status = modal.element.querySelector('input[name="edit-log-status"]:checked').value;
      const expectedDate = modal.element.querySelector('#edit-log-expected-completion').value;

      if (currentPhotos.length < 1) {
        Toast.error('Yêu cầu bắt buộc đính kèm tối thiểu 1 ảnh thực tế.');
        return;
      }

      let note = '';
      let items = undefined;

      if (isWorker) {
        items = [];
        const rows = modal.element.querySelectorAll('.edit-log-item-row');
        rows.forEach(row => {
          const idx = parseInt(row.getAttribute('data-idx'));
          const originalItem = log.items[idx];
          const isCompleted = row.querySelector('.edit-chk-completed').checked;
          const pendingNotes = row.querySelector('.edit-txt-pending-notes').value.trim();

          items.push({
            room: originalItem.room,
            item: originalItem.item,
            isCompleted: isCompleted,
            pendingNotes: isCompleted ? '' : pendingNotes
          });
        });

        note = items.map(it => {
          return `[${it.room} - ${it.item}]: ${it.isCompleted ? 'Đã xong ✅' : `Chưa xong (Cần làm: ${it.pendingNotes}) ⚠️`}`;
        }).join('\n');
      } else {
        note = modal.element.querySelector('#edit-log-note').value;
      }

      const approverEl = modal.element.querySelector('#edit-log-approver-id');
      const approverId = approverEl ? approverEl.value : undefined;
      const success = DB.editDailyLog(project.id, log.id, note, status, expectedDate, currentPhotos, items, user.id, approverId);
      if (success) {
        Toast.success('Cập nhật báo cáo thành công.');
        modal.close();
        onUpdate();
      } else {
        Toast.error('Chỉnh sửa báo cáo thất bại.');
      }
    });
  },

  // 10. OPEN ASSIGN SUBTASK MODAL FOR MANAGER
  openAssignTaskModal(projectId, user, onTaskAdded) {
    const db = DB.load();
    const project = db.projects.find(p => p.id === projectId);
    const workers = db.users.filter(u => u.role !== 'manager');
    const roleTitle = user.role === 'manager' ? 'Sếp' : user.role === 'kts' ? 'KTS' : user.role === 'sales' ? 'Sale' : 'MKT';

    const html = `
      <form id="assign-task-form" style="display:flex; flex-direction:column; gap:16px; max-height:80vh; overflow-y:auto; padding:4px;">
        <div style="border-bottom:1px solid var(--border-color); padding-bottom:8px;">
          <h4 style="font-family:var(--font-title); font-size:1.1rem; color:var(--text-primary);"><i class="fas fa-plus-circle"></i> Giao Nhiệm Vụ Mới</h4>
        </div>

        <div>
          <label class="form-label">Giao nhân sự phụ trách</label>
          <select id="assign-task-worker" class="form-select" required>
            ${workers.map(w => `<option value="${w.id}">${w.name}</option>`).join('')}
          </select>
        </div>

        <!-- 3-level checklist builder for tasks -->
        <div style="display:flex; flex-direction:column; gap:12px;">
          <label class="form-label" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0;">
            <span>Chi tiết hạng mục giao việc</span>
            <button type="button" id="btn-assign-add-item" class="btn-primary" style="padding:6px 12px; font-size:0.75rem; border-radius:8px; height:auto; width:auto; display:flex; align-items:center; gap:4px;">
              <i class="fas fa-plus"></i> Thêm hạng mục
            </button>
          </label>
          <div id="assign-checklist-list" style="display:flex; flex-direction:column; gap:12px;"></div>
        </div>

        <button type="submit" class="btn-primary" style="margin-top:12px;">Giao Nhiệm Vụ</button>
      </form>
    `;

    const modal = Modal.create('Giao Nhiệm Vụ Mới', html);

    const addRow = (container) => {
      const row = document.createElement('div');
      row.className = 'checklist-item-row';
      row.style.cssText = 'background: linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.01) 100%); border: 1px solid rgba(255, 255, 255, 0.08); border-left: 4px solid var(--primary); border-radius: 12px; padding: 14px; display: flex; flex-direction: column; gap: 10px; position: relative; box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 4px 12px rgba(0, 0, 0, 0.2);';

      const hasScope = project && project.scope && project.scope.length > 0;
      const roomsList = hasScope ? [...new Set(project.scope.map(s => s.room))] : ['Phòng ngủ', 'Phòng khách', 'Phòng bếp', 'Phòng thờ', 'Phòng tắm', 'Khác...'];

      row.innerHTML = `
        <button type="button" class="btn-remove-chk-item" style="position: absolute; top: 10px; right: 10px; background: none; border: none; color: var(--status-rejected); font-size: 1.1rem; cursor: pointer; padding: 4px;" title="Xóa">
          <i class="fas fa-times-circle"></i>
        </button>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div>
            <label class="form-label" style="font-size: 0.72rem; margin-bottom: 4px;">Cấp 1: Phòng</label>
            <select class="form-select select-chk-room" required style="padding: 6px 30px 6px 12px; height: 38px; font-size: 0.82rem;">
              <option value="" disabled selected>-- Chọn phòng --</option>
              ${roomsList.map(r => `<option value="${r}">${r}</option>`).join('')}
            </select>
            <input type="text" class="form-input txt-chk-custom-room" placeholder="Tên phòng khác..." style="margin-top: 6px; height: 36px; font-size: 0.8rem; display: none; padding-left: 10px;">
          </div>

          <div>
            <label class="form-label" style="font-size: 0.72rem; margin-bottom: 4px;">Cấp 2: Nội thất</label>
            <select class="form-select select-chk-item" required style="padding: 6px 30px 6px 12px; height: 38px; font-size: 0.82rem;">
              <option value="" disabled selected>-- Chọn phòng trước --</option>
            </select>
            <input type="text" class="form-input txt-chk-custom-item" placeholder="Nội thất khác..." style="margin-top: 6px; height: 36px; font-size: 0.8rem; display: none; padding-left: 10px;">
          </div>
        </div>

        <div>
          <label class="form-label" style="font-size: 0.72rem; margin-bottom: 4px; color: var(--primary);">Cấp 3: Chi tiết công việc giao thợ</label>
          <input type="text" class="form-input txt-chk-pending-notes" placeholder="Ví dụ: đo đạc, lắp ráp hoàn thiện, đi silicone..." required style="height: 36px; font-size: 0.8rem; padding-left: 10px;">
        </div>
      `;

      container.appendChild(row);

      const selectRoom = row.querySelector('.select-chk-room');
      const customRoom = row.querySelector('.txt-chk-custom-room');
      const selectItem = row.querySelector('.select-chk-item');
      const customItem = row.querySelector('.txt-chk-custom-item');

      selectRoom.addEventListener('change', () => {
        const val = selectRoom.value;
        if (val === 'Khác...') {
          customRoom.style.display = 'block';
          customRoom.required = true;
          
          selectItem.innerHTML = `<option value="Khác...">Khác...</option>`;
          customItem.style.display = 'block';
          customItem.required = true;
        } else {
          customRoom.style.display = 'none';
          customRoom.required = false;
          customRoom.value = '';

          let itemsList = [];
          if (hasScope) {
            itemsList = project.scope.filter(s => s.room === val).map(s => s.item);
          } else {
            const fallbackMap = {
              'Phòng ngủ': ['Tủ áo', 'Bàn trang điểm', 'Giường', 'Tủ đầu giường', 'Vách trang trí', 'Khác...'],
              'Phòng khách': ['Tủ giày', 'Vách trang trí', 'Kệ TV', 'Sofa', 'Bàn trà', 'Khác...'],
              'Phòng bếp': ['Bếp trên', 'Bếp dưới', 'Tủ đồ khô', 'Quầy bar', 'Bàn ăn', 'Khác...'],
              'Phòng thờ': ['Bàn thờ', 'Vách CNC', 'Khác...'],
              'Phòng tắm': ['Lavabo', 'Tủ gương', 'Khác...']
            };
            itemsList = fallbackMap[val] || ['Khác...'];
          }

          selectItem.innerHTML = `
            <option value="" disabled selected>-- Chọn nội thất --</option>
            ${itemsList.map(item => `<option value="${item}">${item}</option>`).join('')}
          `;
          customItem.style.display = 'none';
          customItem.required = false;
          customItem.value = '';
        }
      });

      selectItem.addEventListener('change', () => {
        if (selectItem.value === 'Khác...') {
          customItem.style.display = 'block';
          customItem.required = true;
        } else {
          customItem.style.display = 'none';
          customItem.required = false;
          customItem.value = '';
        }
      });

      row.querySelector('.btn-remove-chk-item').addEventListener('click', () => {
        row.remove();
      });
    };

    const container = document.getElementById('assign-checklist-list');
    if (container) {
      addRow(container); // Seed one row by default
    }

    const btnAddItem = document.getElementById('btn-assign-add-item');
    if (btnAddItem && container) {
      btnAddItem.addEventListener('click', () => {
        addRow(container);
      });
    }

    document.getElementById('assign-task-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const workerId = document.getElementById('assign-task-worker').value;

      const rows = document.querySelectorAll('#assign-checklist-list .checklist-item-row');
      if (rows.length === 0) {
        Toast.error('Vui lòng thêm ít nhất 1 hạng mục giao việc.');
        return;
      }

      const loadedDb = DB.load();
      const project = loadedDb.projects.find(p => p.id === projectId);

      if (project) {
        rows.forEach(row => {
          const selectRoom = row.querySelector('.select-chk-room').value;
          const customRoom = row.querySelector('.txt-chk-custom-room').value;
          const room = selectRoom === 'Khác...' ? customRoom.trim() : selectRoom;

          const selectItem = row.querySelector('.select-chk-item').value;
          const customItem = row.querySelector('.txt-chk-custom-item').value;
          const item = selectItem === 'Khác...' ? customItem.trim() : selectItem;

          const notes = row.querySelector('.txt-chk-pending-notes').value.trim();

          const title = `[${room} - ${item}]: ${notes}`;
          const subtaskId = 'sub_' + Math.random().toString(36).substr(2, 9);
          
          project.subtasks.push({
            id: subtaskId,
            title: title,
            assignedTo: workerId,
            status: 'pending',
            type: 'normal'
          });

          project.history.push({
            timestamp: new Date().toISOString(),
            action: `${roleTitle} giao việc: "${title}" (Giao cho: ${loadedDb.users.find(u => u.id === workerId)?.name || 'Thợ'})`,
            user: user.name
          });
        });

        DB.save(loadedDb);
        rows.forEach((row, idx) => {
          const st = project.subtasks[project.subtasks.length - rows.length + idx];
          DB.sbInsertSubtask(st, project.id);
        });
        DB.sbInsertHistory(project.history[project.history.length - 1], project.id);
        Toast.success(`Đã giao thành công ${rows.length} nhiệm vụ.`);
        modal.close();
        onTaskAdded();
      }
    });
  },

  // 10.1 OPEN ASSIGN EXISTING TASK MODAL FOR KTS
  openAssignExistingTaskModal(projectId, taskId, onAssigned) {
    const db = DB.load();
    const workers = db.users.filter(u => u.role !== 'manager');
    const project = db.projects.find(p => p.id === projectId);
    const task = project ? project.subtasks.find(st => st.id === taskId) : null;
    
    if (!task) return;

    const html = `
      <form id="assign-existing-task-form" style="display:flex; flex-direction:column; gap:16px;">
        <div style="border-bottom:1px solid var(--border-color); padding-bottom:8px; margin-bottom:8px;">
          <label class="form-label" style="font-size:0.75rem; color:var(--text-secondary);">Nhiệm vụ cần phân công</label>
          <span style="font-size:0.95rem; font-weight:700; color:var(--text-primary); line-height:1.4; display:block; margin-top:2px;">
            ${task.title}
          </span>
        </div>

        <div>
          <label class="form-label">Chọn nhân sự phụ trách xử lý</label>
          <select id="assign-existing-worker" class="form-select" required>
            ${workers.map(w => `<option value="${w.id}">${w.name}</option>`).join('')}
          </select>
        </div>

        <button type="submit" class="btn-primary" style="margin-top:12px; background:linear-gradient(135deg, var(--primary), #9E815B);">
          Xác Nhận Phân Công
        </button>
      </form>
    `;

    const modal = Modal.create('Phân Công Nhiệm Vụ', html);

    document.getElementById('assign-existing-task-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const workerId = document.getElementById('assign-existing-worker').value;
      const worker = db.users.find(u => u.id === workerId);

      const loadedDb = DB.load();
      const loadedProj = loadedDb.projects.find(p => p.id === projectId);
      const loadedTask = loadedProj ? loadedProj.subtasks.find(st => st.id === taskId) : null;

      if (loadedTask && loadedProj) {
        loadedTask.assignedTo = workerId;
        const hist = {
          timestamp: new Date().toISOString(),
          action: `Phân công nhiệm vụ "${loadedTask.title}" cho: ${worker ? worker.name : 'Chưa rõ'}`,
          user: DB.getCurrentUser().name
        };
        loadedProj.history.push(hist);

        DB.save(loadedDb);
        DB.sbUpdateSubtask(loadedTask.id, { assigned_to: workerId });
        DB.sbInsertHistory(hist, loadedProj.id);
        Toast.success('Đã giao nhiệm vụ thành công!');
        modal.close();
        onAssigned();
      }
    });
  },

  // 10.2 OPEN EDIT SUBTASK MODAL FOR MANAGER/KTS
  openEditSubtaskModal(projectId, taskId, user, onComplete) {
    const db = DB.load();
    const project = db.projects.find(p => p.id === projectId);
    const task = project ? project.subtasks.find(st => st.id === taskId) : null;
    const workers = db.users.filter(u => u.role !== 'manager');

    if (!task) return;

    const html = `
      <form id="edit-subtask-form" style="display:flex; flex-direction:column; gap:16px;">
        <div>
          <label class="form-label">Tên nhiệm vụ</label>
          <input type="text" id="edit-subtask-title" class="form-input" value="${task.title}" required style="padding-left:14px;">
        </div>

        <div>
          <label class="form-label">Giao nhân sự phụ trách</label>
          <select id="edit-subtask-worker" class="form-select" required>
            <option value="">-- Chưa giao --</option>
            ${workers.map(w => `<option value="${w.id}" ${task.assignedTo === w.id ? 'selected' : ''}>${w.name}</option>`).join('')}
          </select>
        </div>

        <button type="submit" class="btn-primary" style="margin-top:12px; background:linear-gradient(135deg, var(--primary), #9E815B);">Cập Nhật Nhiệm Vụ</button>
      </form>
    `;

    const modal = Modal.create('Chỉnh Sửa Nhiệm Vụ', html);

    document.getElementById('edit-subtask-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('edit-subtask-title').value;
      const workerId = document.getElementById('edit-subtask-worker').value;

      const loadedDb = DB.load();
      const loadedProj = loadedDb.projects.find(p => p.id === projectId);
      const loadedTask = loadedProj ? loadedProj.subtasks.find(st => st.id === taskId) : null;

      if (loadedTask && loadedProj) {
        const oldTitle = loadedTask.title;
        const oldAssigned = loadedTask.assignedTo;
        
        loadedTask.title = title;
        loadedTask.assignedTo = workerId;

        const oldWorkerName = oldAssigned ? (loadedDb.users.find(u => u.id === oldAssigned)?.name || 'Chưa rõ') : 'Chưa giao';
        const newWorkerName = workerId ? (loadedDb.users.find(u => u.id === workerId)?.name || 'Chưa rõ') : 'Chưa giao';

        const hist = {
          timestamp: new Date().toISOString(),
          action: `Sửa nhiệm vụ "${oldTitle}" -> "${title}" (Người làm: ${oldWorkerName} -> ${newWorkerName})`,
          user: user.name
        };
        loadedProj.history.push(hist);

        DB.save(loadedDb);
        DB.sbUpdateSubtask(loadedTask.id, { title: title, assigned_to: workerId });
        DB.sbInsertHistory(hist, loadedProj.id);
        Toast.success('Cập nhật nhiệm vụ thành công!');
        modal.close();
        onComplete();
      }
    });
  },

  initScopeEditor(container, initialScope = null) {
    const roomTemplates = {};
    // Group items by room
    const grouped = {};
    if (initialScope && initialScope.length > 0) {
      initialScope.forEach(s => {
        if (!grouped[s.room]) {
          grouped[s.room] = [];
          
          // Deduce template type
          const nameLower = s.room.toLowerCase();
          let deduced = 'Khác...';
          if (nameLower.includes('ngủ') || nameLower.includes('bed')) deduced = 'Phòng ngủ';
          else if (nameLower.includes('khách') || nameLower.includes('living')) deduced = 'Phòng khách';
          else if (nameLower.includes('bếp') || nameLower.includes('kitchen') || nameLower.includes('ăn')) deduced = 'Phòng bếp';
          else if (nameLower.includes('thờ') || nameLower.includes('altar')) deduced = 'Phòng thờ';
          else if (nameLower.includes('tắm') || nameLower.includes('wc') || nameLower.includes('toilet') || nameLower.includes('bath') || nameLower.includes('vệ sinh')) deduced = 'Phòng tắm';
          roomTemplates[s.room] = deduced;
        }
        grouped[s.room].push(s.item);
      });
    }

    const templateItems = {
      'Phòng ngủ': ['Tủ áo', 'Bàn trang điểm', 'Giường', 'Tủ đầu giường', 'Vách trang trí', 'Khác...'],
      'Phòng khách': ['Tủ giày', 'Vách trang trí', 'Kệ TV', 'Sofa', 'Bàn trà', 'Khác...'],
      'Phòng bếp': ['Bếp trên', 'Bếp dưới', 'Tủ đồ khô', 'Quầy bar', 'Bàn ăn', 'Khác...'],
      'Phòng thờ': ['Bàn thờ', 'Vách CNC', 'Khác...'],
      'Phòng tắm': ['Lavabo', 'Tủ gương', 'Khác...'],
      'Khác...': ['Hạng mục 1', 'Hạng mục 2', 'Khác...']
    };

    const render = () => {
      container.innerHTML = `
        <div style="display:block;">
          <!-- Add new Room inline panel -->
          <div style="display:flex; gap:10px; background:rgba(255,255,255,0.03); padding:12px; border-radius:12px; border:1px dashed rgba(255,255,255,0.15); margin-bottom:12px; align-items:stretch;">
            <div style="display:flex; flex-direction:column; gap:8px; flex:1;">
              <select id="scope-add-template" class="form-select" style="height:40px; font-size:0.8rem; padding:4px 8px; margin:0;">
                <option value="Phòng ngủ">Mẫu: Phòng ngủ</option>
                <option value="Phòng khách">Mẫu: Phòng khách</option>
                <option value="Phòng bếp">Mẫu: Phòng bếp</option>
                <option value="Phòng thờ">Mẫu: Phòng thờ</option>
                <option value="Phòng tắm">Mẫu: Phòng tắm</option>
                <option value="Khác...">Mẫu: Khác...</option>
              </select>
              <input type="text" id="scope-add-name" class="form-input" placeholder="Tên phòng (VD: Phòng ngủ con)" style="height:40px; font-size:0.8rem; padding-left:10px; margin:0;">
            </div>
            <button type="button" id="scope-btn-add-room" class="btn-primary" style="width:75px; flex-shrink:0; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px; font-size:0.8rem; margin:0; height:auto; padding:0;"><i class="fas fa-plus"></i> Thêm</button>
          </div>

          <!-- Accordion list: block layout so items never get squished -->
          <div id="scope-accordion-list" style="max-height:300px; overflow-y:auto; padding:2px;">
            ${Object.keys(grouped).map(room => {
              // Look up or deduce template type
              let templateType = roomTemplates[room];
              if (!templateType) {
                const nameLower = room.toLowerCase();
                templateType = 'Khác...';
                if (nameLower.includes('ngủ') || nameLower.includes('bed')) templateType = 'Phòng ngủ';
                else if (nameLower.includes('khách') || nameLower.includes('living')) templateType = 'Phòng khách';
                else if (nameLower.includes('bếp') || nameLower.includes('kitchen') || nameLower.includes('ăn')) templateType = 'Phòng bếp';
                else if (nameLower.includes('thờ') || nameLower.includes('altar')) templateType = 'Phòng thờ';
                else if (nameLower.includes('tắm') || nameLower.includes('wc') || nameLower.includes('toilet') || nameLower.includes('bath') || nameLower.includes('vệ sinh')) templateType = 'Phòng tắm';
                roomTemplates[room] = templateType;
              }

              const items = templateItems[templateType] || templateItems['Khác...'];
              const checkedItems = grouped[room] || [];

              return `
                <div class="scope-room-card" data-room="${room}" style="border:1px solid var(--border-color); border-radius:10px; overflow:hidden; background:rgba(0,0,0,0.1); margin-bottom:8px;">
                  <div class="scope-room-header" style="display:flex; justify-content:space-between; align-items:center; padding:10px 14px; background:rgba(255,255,255,0.03); cursor:pointer; user-select:none; min-height:42px; box-sizing:border-box;">
                    <span style="font-weight:700; font-size:0.8rem; color:var(--text-primary); display:flex; align-items:center; gap:6px;">
                      <i class="fas fa-chevron-right scope-toggle-icon" style="font-size:0.7rem; transition:transform 0.2s; flex-shrink:0;"></i>
                      <i class="fas fa-folder-open" style="color:var(--primary); font-size:0.75rem; flex-shrink:0;"></i>
                      <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${room} <span class="scope-room-count-label" style="font-size:0.7rem; font-weight:normal; color:var(--text-muted);">(${checkedItems.length} đã chọn)</span></span>
                    </span>
                    <button type="button" class="scope-btn-delete-room" data-room="${room}" style="background:none; border:none; color:var(--status-rejected); cursor:pointer; font-size:0.8rem; padding:4px; flex-shrink:0;" title="Xóa phòng này">
                      <i class="fas fa-trash-alt"></i>
                    </button>
                  </div>
                  <div class="scope-room-body" style="display:none; padding:12px; border-top:1px solid var(--border-color); background:rgba(0,0,0,0.15);">
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px 12px;">
                      ${items.map(item => {
                        const isChecked = checkedItems.includes(item);
                        return `
                          <label style="display:flex; align-items:center; gap:6px; font-size:0.75rem; color:var(--text-secondary); cursor:pointer;">
                            <input type="checkbox" class="scope-checkbox-input" data-room="${room}" data-item="${item}" ${isChecked ? 'checked' : ''} style="width:14px; height:14px; accent-color:var(--primary); flex-shrink:0;">
                            <span>${item}</span>
                          </label>
                        `;
                      }).join('')}
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
            ${Object.keys(grouped).length === 0 ? '<p style="text-align:center; font-size:0.75rem; color:var(--text-muted); margin:12px 0;">Chưa thiết lập phòng nào.</p>' : ''}
          </div>
        </div>
      `;

      // Bind Accordion headers toggle
      container.querySelectorAll('.scope-room-header').forEach(header => {
        header.addEventListener('click', (e) => {
          if (e.target.closest('.scope-btn-delete-room')) return;

          const card = header.closest('.scope-room-card');
          const body = card.querySelector('.scope-room-body');
          const icon = card.querySelector('.scope-toggle-icon');
          
          if (body.style.display === 'none') {
            body.style.display = 'block';
            icon.style.transform = 'rotate(90deg)';
          } else {
            body.style.display = 'none';
            icon.style.transform = 'none';
          }
        });
      });

      // Bind Delete Room button
      container.querySelectorAll('.scope-btn-delete-room').forEach(btn => {
        btn.addEventListener('click', () => {
          const room = btn.getAttribute('data-room');
          if (confirm(`Bạn có chắc chắn muốn XÓA phòng "${room}" khỏi danh sách thi công?`)) {
            delete grouped[room];
            render();
          }
        });
      });

      // Bind checkbox change
      container.querySelectorAll('.scope-checkbox-input').forEach(cb => {
        cb.addEventListener('change', () => {
          const room = cb.getAttribute('data-room');
          const item = cb.getAttribute('data-item');
          if (!grouped[room]) grouped[room] = [];

          if (cb.checked) {
            if (!grouped[room].includes(item)) grouped[room].push(item);
          } else {
            grouped[room] = grouped[room].filter(x => x !== item);
          }

          // Update count label in header
          const card = cb.closest('.scope-room-card');
          const label = card.querySelector('.scope-room-count-label');
          if (label) {
            label.textContent = `(${grouped[room].length} đã chọn)`;
          }
        });
      });

      // Bind Add Room Button
      const btnAdd = document.getElementById('scope-btn-add-room');
      const inputName = document.getElementById('scope-add-name');
      const selectTemplate = document.getElementById('scope-add-template');
      if (btnAdd && inputName && selectTemplate) {
        btnAdd.addEventListener('click', () => {
          const template = selectTemplate.value;
          let name = inputName.value.trim();
          if (!name) {
            const existingCount = Object.keys(grouped).filter(k => k.startsWith(template)).length;
            name = existingCount > 0 ? `${template} ${existingCount + 1}` : template;
          }

          if (grouped[name]) {
            Toast.error('Phòng này đã tồn tại!');
            return;
          }

          roomTemplates[name] = template;
          grouped[name] = [];
          render();
          
          // Automatically expand the newly added room
          const newCard = container.querySelector(`.scope-room-card[data-room="${name}"]`);
          if (newCard) {
            const body = newCard.querySelector('.scope-room-body');
            const icon = newCard.querySelector('.scope-toggle-icon');
            if (body && icon) {
              body.style.display = 'block';
              icon.style.transform = 'rotate(90deg)';
            }
          }
        });
      }
    };

    render();

    return {
      getSelectedScope() {
        const list = [];
        container.querySelectorAll('.scope-checkbox-input:checked').forEach(cb => {
          list.push({
            room: cb.getAttribute('data-room'),
            item: cb.getAttribute('data-item')
          });
        });
        return list;
      }
    };
  },

  openCreateProjectModal(user, onCreateSuccess) {

    const html = `
      <form id="create-project-form" style="display:flex; flex-direction:column; gap:16px;">
        <div>
          <label class="form-label">Tên công trình nội thất</label>
          <input type="text" id="new-prj-name" class="form-input" placeholder="" required style="padding-left:14px;">
        </div>

        <!-- 2-level Scope of work collapsible accordion editor -->
        <div>
          <label class="form-label" style="color:var(--primary); font-weight:700; display:flex; align-items:center; gap:6px;"><i class="fas fa-list-check"></i> Thiết lập Hạng mục thi công</label>
          <div id="new-project-scope-container"></div>
        </div>

        <div style="background-color: rgba(188, 156, 116, 0.08); padding: 14px; border-radius: 12px; border: 1px dashed var(--primary); margin-top: 4px;">
          <label class="form-label" style="margin-bottom:6px; font-weight:700; color:var(--primary); display:flex; align-items:center; gap:6px;"><i class="fas fa-calendar-alt"></i> Hạn hoàn thành tổng (Deadline)</label>
          <input type="date" id="new-prj-deadline" class="form-input" required style="padding-left:14px; border-color: var(--primary);">
        </div>

        <button type="submit" class="btn-primary" style="margin-top:12px;">Tạo Thẻ Công Trình</button>
      </form>
    `;

    const modal = Modal.create('Thêm Mới Công Trình', html);

    // Initialize scope editor
    const scopeContainer = document.getElementById('new-project-scope-container');
    const scopeEditor = this.initScopeEditor(scopeContainer);

    // Default date is today + 10 days
    const d = new Date();
    d.setDate(d.getDate() + 10);
    document.getElementById('new-prj-deadline').value = d.toISOString().split('T')[0];

    document.getElementById('create-project-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('new-prj-name').value;
      const deadline = document.getElementById('new-prj-deadline').value;

      const assignees = [];

      const scope = scopeEditor.getSelectedScope();

      const loadedDb = DB.load();
      
      // Get assignees names for history action text
      const namesStr = assignees.map(id => {
        const u = loadedDb.users.find(usr => usr.id === id);
        return u ? u.name : id;
      }).join(', ') || 'Chưa gán';

      const newPrj = {
        id: 'prj_' + Math.random().toString(36).substr(2, 9),
        name: name,
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
        assignees: assignees,
        scope: scope,
        history: [
          { timestamp: new Date().toISOString(), action: `Khởi tạo công trình. Nhân sự phụ trách: [${namesStr}]`, user: user.name }
        ]
      };

      loadedDb.projects.push(newPrj);
      DB.save(loadedDb);
      DB.sbInsertProject(newPrj);
      DB.sbInsertHistory(newPrj.history[0], newPrj.id);
      Toast.success('Đã thêm mới công trình ở Bước 1.');
      modal.close();
      onCreateSuccess();
    });
  },

  // 11.1 OPEN EDIT PROJECT MODAL FOR MANAGER
  openEditProjectModal(projectId, user, onComplete) {
    const db = DB.load();
    const project = db.projects.find(p => p.id === projectId);
    if (!project) return;

    const workers = db.users.filter(u => u.role === 'lead_worker' || u.role === 'assistant_worker');
    const currentAssignees = project.assignees || [];

    const html = `
      <form id="edit-project-form" style="display:flex; flex-direction:column; gap:16px;">
        <div>
          <label class="form-label">Tên công trình nội thất</label>
          <input type="text" id="edit-prj-name" class="form-input" value="${project.name}" required style="padding-left:14px;">
        </div>

        <div>
          <label class="form-label">Nhân sự phụ trách công trình</label>
          <div style="max-height: 120px; overflow-y: auto; display:flex; flex-direction:column; gap:8px; border:1px solid var(--border-color); border-radius:10px; padding:10px; background-color:rgba(0,0,0,0.1);">
            ${workers.map(w => {
              const roleLabel = w.role === 'lead_worker' ? 'Thợ chính' : 'Thợ phụ';
              const isChecked = currentAssignees.includes(w.id);
              return `
                <label style="display:flex; align-items:center; justify-content:space-between; cursor:pointer;">
                  <span style="font-size:0.8rem; color:var(--text-primary);">${w.name} (${roleLabel})</span>
                  <input type="checkbox" name="edit-prj-assignee" value="${w.id}" ${isChecked ? 'checked' : ''} style="width:16px; height:16px; accent-color:var(--primary);">
                </label>
              `;
            }).join('')}
          </div>
        </div>

        <!-- 2-level Scope of work collapsible accordion editor -->
        <div>
          <label class="form-label" style="color:var(--primary); font-weight:700; display:flex; align-items:center; gap:6px;"><i class="fas fa-list-check"></i> Thiết lập Hạng mục thi công (Scope of Work)</label>
          <div id="edit-project-scope-container"></div>
        </div>

        <div>
          <label class="form-label">Hạn hoàn thành tổng (Deadline)</label>
          <input type="date" id="edit-prj-deadline" class="form-input" value="${project.deadline}" required style="padding-left:14px;">
        </div>

        <button type="submit" class="btn-primary" style="margin-top:12px; background:linear-gradient(135deg, var(--primary), #9E815B);">
          Lưu Thay Đổi
        </button>
      </form>
    `;

    const modal = Modal.create('Chỉnh Sửa Công Trình', html);

    // Initialize scope editor with existing project scope
    const scopeContainer = document.getElementById('edit-project-scope-container');
    const scopeEditor = this.initScopeEditor(scopeContainer, project.scope || []);

    document.getElementById('edit-project-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('edit-prj-name').value;
      const deadline = document.getElementById('edit-prj-deadline').value;

      const selectedCheckboxes = document.querySelectorAll('input[name="edit-prj-assignee"]:checked');
      const assignees = Array.from(selectedCheckboxes).map(cb => cb.value);

      const scope = scopeEditor.getSelectedScope();

      const updated = DB.updateProjectInfo(projectId, name, deadline, user.id, assignees, scope);
      if (updated) {
        Toast.success('Cập nhật thông tin công trình thành công!');
        modal.close();
        onComplete();
      }
    });
  },

  // 12. RENDER MANAGER REPORT & ANALYTICS DASHBOARD
  renderManagerDashboard() {
    const container = document.getElementById('manager-tab-content');
    const analytics = DB.getAnalytics();

    // Sum data for stats
    const totalProjects = DB.getProjects().length;

    container.innerHTML = `
      <div class="fade-in" style="display:flex; flex-direction:column; gap:24px;">
        
        <!-- Summary widgets -->
        <div class="stats-grid">
          <div class="stat-mini-card btn-summary-errors" style="cursor:pointer; border-color:var(--status-rejected); transition: transform var(--transition-fast);" onmouseover="this.style.transform='translateY(-1px)'" onmouseout="this.style.transform='translateY(0)'">
            <span class="stat-mini-title" style="display:flex; justify-content:space-between; align-items:center;">
              <span>Nhãn Đỏ [SỬA LỖI]</span>
              <i class="fas fa-search-plus" style="font-size:0.7rem; color:var(--status-rejected); opacity:0.6;"></i>
            </span>
            <span class="stat-mini-val" style="color:var(--status-rejected);"><i class="fas fa-exclamation-triangle"></i> ${analytics.errorsCount}</span>
          </div>
          <div class="stat-mini-card btn-summary-scopes" style="cursor:pointer; border-color:var(--status-pending); transition: transform var(--transition-fast);" onmouseover="this.style.transform='translateY(-1px)'" onmouseout="this.style.transform='translateY(0)'">
            <span class="stat-mini-title" style="display:flex; justify-content:space-between; align-items:center;">
              <span>Nhãn Cam [PHÁT SINH]</span>
              <i class="fas fa-search-plus" style="font-size:0.7rem; color:var(--status-pending); opacity:0.6;"></i>
            </span>
            <span class="stat-mini-val" style="color:var(--status-pending);"><i class="fas fa-plus-circle"></i> ${analytics.scopeCount}</span>
          </div>
        </div>

        <!-- 1. Biểu đồ luồng (Pipeline Distribution) -->
        <div class="material-stats-card">
          <h4 class="section-title" style="margin-bottom:14px;"><i class="fas fa-chart-line"></i> Biểu đồ Luồng Tiến Độ</h4>
          
          <div class="material-list">
            
            <div class="material-row">
              <span style="width:120px; font-size:0.8rem;">Thiết kế (B1-B4)</span>
              <div class="material-progress-container">
                <div class="material-progress-bar" style="width: ${totalProjects ? (analytics.pipeline.design / totalProjects * 100) : 0}%; background:var(--primary);"></div>
              </div>
              <span style="font-weight:600; font-size:0.85rem;">${analytics.pipeline.design} căn</span>
            </div>

            <div class="material-row">
              <span style="width:120px; font-size:0.8rem;">Gia công xưởng (B5-B7)</span>
              <div class="material-progress-container">
                <div class="material-progress-bar" style="width: ${totalProjects ? (analytics.pipeline.workshop / totalProjects * 100) : 0}%; background:#9E815B;"></div>
              </div>
              <span style="font-weight:600; font-size:0.85rem;">${analytics.pipeline.workshop} căn</span>
            </div>

            <div class="material-row">
              <span style="width:120px; font-size:0.8rem;">Lắp đặt hiện trường (B8)</span>
              <div class="material-progress-container">
                <div class="material-progress-bar" style="width: ${totalProjects ? (analytics.pipeline.onsite / totalProjects * 100) : 0}%; background:var(--status-pending);"></div>
              </div>
              <span style="font-weight:600; font-size:0.85rem;">${analytics.pipeline.onsite} căn</span>
            </div>

            <div class="material-row">
              <span style="width:120px; font-size:0.8rem;">Đã bàn giao (B9)</span>
              <div class="material-progress-container">
                <div class="material-progress-bar" style="width: ${totalProjects ? (analytics.pipeline.completed / totalProjects * 100) : 0}%; background:var(--status-approved);"></div>
              </div>
              <span style="font-weight:600; font-size:0.85rem;">${analytics.pipeline.completed} căn</span>
            </div>

          </div>
        </div>

        <!-- 2. Tỉ lệ nguyên nhân gây chậm tiến độ -->
        <div class="material-stats-card">
          <h4 class="section-title" style="margin-bottom:14px;"><i class="fas fa-hourglass-half"></i> Nguyên Nhân Chậm Tiến Độ Nhiều Nhất</h4>
          <div class="material-list">
            ${Object.entries(analytics.delayReasons).map(([reason, count]) => {
              const maxCount = Math.max(...Object.values(analytics.delayReasons), 1);
              return `
                <div class="material-row btn-delay-reason-detail" data-reason="${reason}" style="cursor:pointer; padding:8px; border-radius:8px; transition: background-color var(--transition-fast);" onmouseover="this.style.backgroundColor='rgba(255,255,255,0.02)'" onmouseout="this.style.backgroundColor='transparent'">
                  <span style="width:140px; font-size:0.8rem; line-height:1.2; font-weight:500;">${reason}</span>
                  <div class="material-progress-container" style="flex:1;">
                    <div class="material-progress-bar" style="width: ${(count / maxCount * 100)}%; background-color: var(--status-rejected);"></div>
                  </div>
                  <span style="font-weight:700; font-size:0.85rem; color:var(--primary); margin-left:8px; display:flex; align-items:center; gap:4px;">
                    ${count} vụ <i class="fas fa-search-plus" style="font-size:0.75rem; opacity:0.6;"></i>
                  </span>
                </div>
              `;
            }).join('')}
          </div>
        </div>

      </div>
    `;
    this.bindDashboardDetailListeners();
  },

  // 13. EXPORT COMPLETED PROJECT TO EXCEL CSV (UTF-8 WITH BOM)
  exportProjectToExcel(projectId) {
    const project = DB.getProject(projectId);
    if (!project) {
      Toast.error('Không tìm thấy thông tin công trình.');
      return;
    }

    const db = DB.load();

    const escapeCSV = (val) => {
      if (val === null || val === undefined) return '';
      let str = String(val).replace(/"/g, '""');
      if (str.includes(',') || str.includes('\n') || str.includes('"')) {
        return `"${str}"`;
      }
      return str;
    };

    let csvContent = '\uFEFF'; // UTF-8 BOM for Microsoft Excel Vietnamese support

    csvContent += 'THÔNG TIN CHUNG CÔNG TRÌNH\n';
    csvContent += `Tên công trình,${escapeCSV(project.name)}\n`;
    csvContent += `Trạng thái,Đã hoàn thành bàn giao\n`;
    csvContent += `Hoàn thành lúc,${escapeCSV(project.completedAt ? new Date(project.completedAt).toLocaleString('vi-VN') : '')}\n`;
    csvContent += `Hạn hoàn thành gốc,${escapeCSV(project.originalDeadline)}\n`;
    csvContent += `Hạn hoàn thành điều chỉnh,${escapeCSV(project.deadline)}\n`;
    csvContent += `Tổng thời gian đóng băng,${escapeCSV(project.totalFreezeTime ? Math.round(project.totalFreezeTime / 60000) + ' phút' : '0 phút')}\n\n`;

    csvContent += 'DANH SÁCH NHIỆM VỤ CON\n';
    csvContent += 'Mã nhiệm vụ,Tên nhiệm vụ,Loại,Người phụ trách,Trạng thái,Thời gian hoàn thành\n';
    project.subtasks.forEach(st => {
      const worker = db.users.find(u => u.id === st.assignedTo);
      const workerName = worker ? worker.name : 'Chưa giao';
      const typeDisplay = st.type === 'rework' ? 'Sửa hàng lỗi' : st.type === 'small_scope' ? 'Phát sinh' : 'Nhiệm vụ thường';
      const statusDisplay = st.status === 'completed' ? 'Đã xong' : 'Chưa xong';
      const compTime = st.completedAt ? new Date(st.completedAt).toLocaleString('vi-VN') : '';
      csvContent += `${escapeCSV(st.id)},${escapeCSV(st.title)},${escapeCSV(typeDisplay)},${escapeCSV(workerName)},${escapeCSV(statusDisplay)},${escapeCSV(compTime)}\n`;
    });
    csvContent += '\n';

    csvContent += 'NHẬT KÝ BÁO CÁO HÀNG NGÀY\n';
    csvContent += 'Ngày báo cáo,Người báo cáo,Vai trò,Trạng thái tiến độ,Nội dung ghi chú\n';
    project.dailyLogs.forEach(l => {
      const roleDisplay = l.reporterRole === 'lead_worker' ? 'Thợ chính' : l.reporterRole === 'assistant_worker' ? 'Thợ phụ' : l.reporterRole === 'kts' ? 'Thiết kế' : l.reporterRole === 'sales' ? 'Sale' : 'Khác';
      const statusDisplay = l.status === 'on_track' ? 'Đúng tiến độ' : 'Bị chậm';
      csvContent += `${escapeCSV(l.date)},${escapeCSV(l.reporterName)},${escapeCSV(roleDisplay)},${escapeCSV(statusDisplay)},${escapeCSV(l.note)}\n`;
    });
    csvContent += '\n';

    csvContent += 'LỊCH SỬ HỆ THỐNG\n';
    csvContent += 'Thời gian,Hành động,Người thực hiện\n';
    project.history.forEach(h => {
      csvContent += `${escapeCSV(new Date(h.timestamp).toLocaleString('vi-VN'))},${escapeCSV(h.action)},${escapeCSV(h.user)}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    
    // Normalize filename
    const sanitizedName = project.name.replace(/[^a-zA-Z0-9-]/g, '_');
    link.setAttribute('download', `[MocTienPhat]_${sanitizedName}_BaoCaoChiTiet.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    Toast.success('Đã tải xuống file báo cáo Excel (CSV) thành công.');
  },

  // 13.1 EXPORT PROJECT TO RAW JSON FILE FOR HARD STORAGE/BACKUP
  exportProjectToJson(projectId) {
    const project = DB.getProject(projectId);
    if (!project) {
      Toast.error('Không tìm thấy thông tin công trình.');
      return;
    }
    const jsonStr = JSON.stringify(project, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    
    const sanitizedName = project.name.replace(/[^a-zA-Z0-9-]/g, '_');
    link.setAttribute('download', `[MocTienPhat]_${sanitizedName}_BackupData.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    Toast.success('Đã tải file sao lưu cứng (.json) thành công! Hãy lưu giữ file này để giải phóng dung lượng web.');
  },

  // 13.2 IMPORT PROJECT FROM BACKUP JSON FILE
  importProjectFromJson(file, user, onComplete) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const project = JSON.parse(e.target.result);
        if (!project.id || !project.name || !Array.isArray(project.subtasks)) {
          throw new Error('Định dạng file sao lưu JSON không hợp lệ.');
        }

        const db = DB.load();
        const existingIdx = db.projects.findIndex(p => p.id === project.id);
        if (existingIdx > -1) {
          if (!confirm(`Công trình "${project.name}" đã tồn tại trong hệ thống. Bạn có muốn ghi đè dữ liệu hiện tại bằng file sao lưu này không?`)) {
            return;
          }
          db.projects[existingIdx] = project;
        } else {
          db.projects.push(project);
        }

        db.systemLogs.push({
          timestamp: new Date().toISOString(),
          action: `Khôi phục công trình từ file sao lưu JSON: "${project.name}"`,
          user: user.name
        });

        DB.save(db);
        if (typeof supabaseClient !== 'undefined' && supabaseClient) {
          DB.sbInsertProject(project);
          if (existingIdx > -1) {
            supabaseClient.from('project_history').delete().eq('project_id', project.id).then(() => {
              if (project.history) project.history.forEach(h => DB.sbInsertHistory(h, project.id));
            });
            supabaseClient.from('subtasks').delete().eq('project_id', project.id).then(() => {
              if (project.subtasks) project.subtasks.forEach(st => DB.sbInsertSubtask(st, project.id));
            });
            supabaseClient.from('daily_logs').delete().eq('project_id', project.id).then(() => {
              if (project.dailyLogs) project.dailyLogs.forEach(dl => DB.sbInsertDailyLog(dl, project.id));
            });
          } else {
            if (project.history) project.history.forEach(h => DB.sbInsertHistory(h, project.id));
            if (project.subtasks) project.subtasks.forEach(st => DB.sbInsertSubtask(st, project.id));
            if (project.dailyLogs) project.dailyLogs.forEach(dl => DB.sbInsertDailyLog(dl, project.id));
          }
        }
        Toast.success('Khôi phục công trình thành công!');
        onComplete();
      } catch (err) {
        Toast.error('Lỗi khôi phục: ' + err.message);
      }
    };
    reader.readAsText(file);
  },

  // 13.3 BIND IMPORT FILE LISTENERS
  bindImportBackupListener(user) {
    const btn = document.getElementById('btn-import-project-backup');
    const input = document.getElementById('import-project-file-input');
    if (btn && input) {
      // Avoid adding multiple listeners if bound multiple times
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
      
      const newInput = input.cloneNode(true);
      input.parentNode.replaceChild(newInput, input);

      newBtn.addEventListener('click', () => newInput.click());
      newInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          this.importProjectFromJson(file, user, () => {
            this.renderManagerCompleted(user);
          });
        }
        newInput.value = '';
      });
    }
  },

  // 9. SILENT UPDATE CURRENT SCREEN DATA WITHOUT WIPING FORM INPUTS
  refreshActiveView(user) {
    const userRoleTag = document.querySelector('.user-role-tag');
    if (!userRoleTag) return; // Not logged in yet

    // 9.1 If manager is logged in, refresh the active tab's specific render function
    const btnKanban = document.getElementById('tab-kanban-btn');
    if (btnKanban) {
      const btnCompleted = document.getElementById('tab-completed-btn');
      const btnLogs = document.getElementById('tab-logs-btn');
      const btnDashboard = document.getElementById('tab-dashboard-btn');

      if (btnKanban.classList.contains('active')) {
        this.renderManagerKanban(user);
      } else if (btnCompleted.classList.contains('active')) {
        this.renderManagerCompleted(user);
      } else if (btnLogs.classList.contains('active')) {
        this.renderManagerLogs(user);
      } else if (btnDashboard.classList.contains('active')) {
        this.renderManagerDashboard();
      }
    } else {
      let relevantProjects = DB.getProjectsForUser(user);

      const statProjects = document.getElementById('stat-projects-btn');
      if (statProjects) {
        const vals = statProjects.parentNode.querySelectorAll('.stat-mini-val');
        if (vals.length >= 2) {
          vals[0].textContent = relevantProjects.length;
          const pendingCount = relevantProjects.reduce((acc, p) => acc + p.subtasks.filter(st => st.assignedTo === user.id && st.status === 'pending').length, 0);
          vals[1].textContent = pendingCount;
        }
      }
    }
  },

  // 12.1 REGISTER DETAILED REPORT EVENT LISTENERS
  bindDashboardDetailListeners() {
    const container = document.getElementById('manager-tab-content');
    if (!container) return;

    // Delay Reasons details
    container.querySelectorAll('.btn-delay-reason-detail').forEach(el => {
      el.addEventListener('click', () => {
        const reason = el.getAttribute('data-reason');
        this.showDelayReasonDetails(reason);
      });
    });

    // Designer freeze details
    container.querySelectorAll('.btn-designer-detail').forEach(el => {
      el.addEventListener('click', () => {
        const userId = el.getAttribute('data-userid');
        const name = el.getAttribute('data-name');
        this.showDesignerProductivityDetails(userId, name);
      });
    });

    // Worker completed tasks details
    container.querySelectorAll('.btn-worker-completed-detail').forEach(el => {
      el.addEventListener('click', () => {
        const userId = el.getAttribute('data-userid');
        const name = el.getAttribute('data-name');
        this.showWorkerCompletedDetails(userId, name);
      });
    });

    // Worker rework details
    container.querySelectorAll('.btn-worker-rework-detail').forEach(el => {
      el.addEventListener('click', () => {
        const userId = el.getAttribute('data-userid');
        const name = el.getAttribute('data-name');
        this.showWorkerReworkDetails(userId, name);
      });
    });

    // Summary widget: Errors (Nhãn Đỏ) details
    container.querySelectorAll('.btn-summary-errors').forEach(el => {
      el.addEventListener('click', () => {
        this.showDelayReasonDetails('Sản xuất/Thi công sai lỗi');
      });
    });

    // Summary widget: Scopes (Nhãn Cam) details
    container.querySelectorAll('.btn-summary-scopes').forEach(el => {
      el.addEventListener('click', () => {
        this.showSummaryScopesDetails();
      });
    });
  },

  // 12.2 SHOW DELAY REASON DETAIL MODAL
  showDelayReasonDetails(reason) {
    const projects = DB.getProjects();
    let itemsHtml = '';

    if (reason === 'Khách đổi ý/chậm duyệt' || reason === 'Tắc nghẽn hiện trường' || reason === 'Trễ vật tư/phụ kiện') {
      const matchKeywords = {
        'Khách đổi ý/chậm duyệt': ['khách', 'duyệt', 'đổi ý', 'ngâm', 'chờ'],
        'Tắc nghẽn hiện trường': ['hiện trường', 'tắc', 'mặt bằng', 'chưa giao', 'vướng'],
        'Trễ vật tư/phụ kiện': ['vật tư', 'thiếu', 'phụ kiện', 'chưa về', 'gỗ', 'ray', 'bản lề', 'trễ']
      }[reason];

      // Find from frozen projects
      const frozenMatches = projects.filter(p => p.isFrozen && p.freezeReason && matchKeywords.some(k => p.freezeReason.toLowerCase().includes(k)));
      
      // Find from delayed daily logs
      let logMatches = [];
      projects.forEach(p => {
        p.dailyLogs.forEach(l => {
          if (l.status === 'delayed' && l.note && matchKeywords.some(k => l.note.toLowerCase().includes(k))) {
            logMatches.push({
              projectName: p.name,
              date: l.date,
              reporter: l.reporterName,
              note: l.note
            });
          }
        });
      });

      if (frozenMatches.length === 0 && logMatches.length === 0) {
        itemsHtml = '<p style="font-size:0.85rem; color:var(--text-muted); text-align:center; padding:16px;">Không tìm thấy chi tiết sự việc nào.</p>';
      } else {
        itemsHtml = `
          <div style="display:flex; flex-direction:column; gap:12px;">
            ${frozenMatches.map(p => `
              <div style="background-color:rgba(255,255,255,0.02); border:1px solid var(--border-color); border-radius:12px; padding:12px;">
                <div style="font-size:0.85rem; font-weight:700; color:var(--text-primary);"><i class="fas fa-snowflake" style="color:var(--status-pending); margin-right:4px;"></i> ${p.name}</div>
                <div style="font-size:0.78rem; color:var(--status-rejected); font-weight:600; margin-top:6px;">Lý do treo: "${p.freezeReason}"</div>
                <div style="font-size:0.7rem; color:var(--text-muted); margin-top:4px;">Trạng thái: Đóng băng tiến độ</div>
              </div>
            `).join('')}
            ${logMatches.map(l => `
              <div style="background-color:rgba(255,255,255,0.02); border:1px solid var(--border-color); border-radius:12px; padding:12px;">
                <div style="font-size:0.85rem; font-weight:700; color:var(--text-primary);"><i class="fas fa-clock" style="color:var(--status-rejected); margin-right:4px;"></i> ${l.projectName}</div>
                <div style="font-size:0.78rem; color:var(--text-secondary); margin-top:6px;">Báo cáo chậm: "${l.note}"</div>
                <div style="font-size:0.7rem; color:var(--text-muted); margin-top:4px;">Bởi: ${l.reporter} • Ngày: ${l.date}</div>
              </div>
            `).join('')}
          </div>
        `;
      }
    } else if (reason === 'Sản xuất/Thi công sai lỗi') {
      // Find all rework subtasks
      let reworkTasks = [];
      projects.forEach(p => {
        p.subtasks.forEach(st => {
          if (st.type === 'rework') {
            reworkTasks.push({
              projectName: p.name,
              taskTitle: st.title,
              assignedTo: st.assignedTo,
              status: st.status,
              completedAt: st.completedAt
            });
          }
        });
      });

      if (reworkTasks.length === 0) {
        itemsHtml = '<p style="font-size:0.85rem; color:var(--text-muted); text-align:center; padding:16px;">Không có lỗi sản xuất/thi công nào.</p>';
      } else {
        const db = DB.load();
        itemsHtml = `
          <div style="display:flex; flex-direction:column; gap:12px;">
            ${reworkTasks.map(t => {
              const worker = db.users.find(u => u.id === t.assignedTo);
              return `
                <div style="background-color:rgba(255,255,255,0.02); border:1px solid var(--border-color); border-radius:12px; padding:12px; display:flex; justify-content:space-between; align-items:center; gap:12px;">
                  <div>
                    <div style="font-size:0.85rem; font-weight:700; color:var(--text-primary);"><i class="fas fa-exclamation-triangle" style="color:var(--status-rejected); margin-right:4px;"></i> ${t.taskTitle}</div>
                    <div style="font-size:0.78rem; color:var(--primary); font-weight:600; margin-top:4px;">Dự án: ${t.projectName}</div>
                    <div style="font-size:0.72rem; color:var(--text-muted); margin-top:2px;">Người làm: ${worker ? worker.name : 'Chưa giao'}</div>
                  </div>
                  <div>
                    <span class="status-badge ${t.status === 'completed' ? 'approved' : 'pending'}" style="font-size:0.7rem;">
                      ${t.status === 'completed' ? 'Đã khắc phục' : 'Chưa xử lý'}
                    </span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `;
      }
    }

    Modal.create(`Chi Tiết: ${reason}`, `
      <div style="max-height:480px; overflow-y:auto; padding-right:4px;">
        ${itemsHtml}
      </div>
    `);
  },

  // 12.3 SHOW DESIGNER PRODUCTIVITY DETAILS
  showDesignerProductivityDetails(userId, name) {
    if (!userId) {
      Toast.error('Không tìm thấy ID người dùng.');
      return;
    }
    const projects = DB.getProjects();
    let freezeRecords = [];

    projects.forEach(p => {
      p.history.forEach(h => {
        if (h.action.includes('Đóng băng') && (p.subtasks.some(st => st.assignedTo === userId) || h.action.includes(name))) {
          freezeRecords.push({
            projectName: p.name,
            action: h.action,
            time: h.timestamp
          });
        }
      });
    });

    let html = '';
    if (freezeRecords.length === 0) {
      html = '<p style="font-size:0.85rem; color:var(--text-muted); text-align:center; padding:16px;">KTS không có lịch sử chậm duyệt thiết kế nào.</p>';
    } else {
      html = `
        <div style="display:flex; flex-direction:column; gap:12px; max-height:480px; overflow-y:auto; padding-right:4px;">
          ${freezeRecords.map(r => `
            <div style="background-color:rgba(255,255,255,0.02); border:1px solid var(--border-color); border-radius:12px; padding:12px;">
              <div style="font-size:0.85rem; font-weight:700; color:var(--text-primary);">${r.projectName}</div>
              <div style="font-size:0.78rem; color:var(--status-rejected); margin-top:4px; font-weight:600;">${r.action}</div>
              <div style="font-size:0.7rem; color:var(--text-muted); margin-top:4px;">Thời gian: ${new Date(r.time).toLocaleString('vi-VN')}</div>
            </div>
          `).join('')}
        </div>
      `;
    }

    Modal.create(`Chậm Duyệt Thiết Kế: ${name}`, html);
  },

  // 12.4 SHOW WORKER COMPLETED TASKS DETAILS
  showWorkerCompletedDetails(userId, name) {
    if (!userId) {
      Toast.error('Không tìm thấy ID người dùng.');
      return;
    }
    const projects = DB.getProjects();
    let completedTasks = [];

    projects.forEach(p => {
      p.subtasks.forEach(st => {
        if (st.assignedTo === userId && st.status === 'completed') {
          completedTasks.push({
            projectName: p.name,
            taskTitle: st.title,
            completedAt: st.completedAt
          });
        }
      });
    });

    let html = '';
    if (completedTasks.length === 0) {
      html = '<p style="font-size:0.85rem; color:var(--text-muted); text-align:center; padding:16px;">Thợ chưa hoàn thành nhiệm vụ nào.</p>';
    } else {
      html = `
        <div style="display:flex; flex-direction:column; gap:12px; max-height:480px; overflow-y:auto; padding-right:4px;">
          ${completedTasks.map(t => `
            <div style="background-color:rgba(255,255,255,0.02); border:1px solid var(--border-color); border-radius:12px; padding:12px; display:flex; justify-content:space-between; align-items:center;">
              <div>
                <div style="font-size:0.85rem; font-weight:700; color:var(--text-primary);">${t.taskTitle}</div>
                <div style="font-size:0.75rem; color:var(--primary); margin-top:2px;">Dự án: ${t.projectName}</div>
              </div>
              <div style="text-align:right;">
                <span class="status-badge approved" style="font-size:0.7rem;">Xong đúng hạn</span>
                ${t.completedAt ? `<div style="font-size:0.68rem; color:var(--text-muted); margin-top:4px;">${new Date(t.completedAt).toLocaleDateString('vi-VN')}</div>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    Modal.create(`Công Việc Hoàn Thành: ${name}`, html);
  },

  // 12.5 SHOW WORKER REWORK DETAILS
  showWorkerReworkDetails(userId, name) {
    if (!userId) {
      Toast.error('Không tìm thấy ID người dùng.');
      return;
    }
    const projects = DB.getProjects();
    let reworkTasks = [];

    projects.forEach(p => {
      p.subtasks.forEach(st => {
        if (st.assignedTo === userId && st.type === 'rework') {
          reworkTasks.push({
            projectName: p.name,
            taskTitle: st.title,
            status: st.status
          });
        }
      });
    });

    let html = '';
    if (reworkTasks.length === 0) {
      html = '<p style="font-size:0.85rem; color:var(--text-muted); text-align:center; padding:16px;">Thợ chưa từng sản xuất lỗi lần nào (Rát tốt!).</p>';
    } else {
      html = `
        <div style="display:flex; flex-direction:column; gap:12px; max-height:480px; overflow-y:auto; padding-right:4px;">
          ${reworkTasks.map(t => `
            <div style="background-color:rgba(255,255,255,0.02); border:1px solid var(--border-color); border-radius:12px; padding:12px; display:flex; justify-content:space-between; align-items:center;">
              <div>
                <div style="font-size:0.85rem; font-weight:700; color:var(--text-primary);"><i class="fas fa-exclamation-triangle" style="color:var(--status-rejected); margin-right:4px;"></i> ${t.taskTitle}</div>
                <div style="font-size:0.75rem; color:var(--primary); margin-top:2px;">Dự án: ${t.projectName}</div>
              </div>
              <div>
                <span class="status-badge ${t.status === 'completed' ? 'approved' : 'pending'}" style="font-size:0.7rem;">
                  ${t.status === 'completed' ? 'Đã sửa xong' : 'Đang xử lý'}
                </span>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    Modal.create(`Danh Sách Lỗi Sản Xuất: ${name}`, html);
  },

  // 12.6 SHOW SUMMARY SCOPES (NHÃN CAM) DETAIL MODAL
  showSummaryScopesDetails() {
    const projects = DB.getProjects();
    const db = DB.load();
    
    // 1. Large scope projects
    const largeScopes = projects.filter(p => p.name.includes('[PHÁT SINH]'));

    // 2. Small scope tasks
    let smallScopes = [];
    projects.forEach(p => {
      p.subtasks.forEach(st => {
        if (st.type === 'small_scope') {
          smallScopes.push({
            projectName: p.name,
            taskTitle: st.title,
            assignedTo: st.assignedTo,
            status: st.status
          });
        }
      });
    });

    let html = '';
    if (largeScopes.length === 0 && smallScopes.length === 0) {
      html = '<p style="font-size:0.85rem; color:var(--text-muted); text-align:center; padding:16px;">Không có dự án/đầu việc phát sinh nào.</p>';
    } else {
      html = `
        <div style="display:flex; flex-direction:column; gap:16px; max-height:480px; overflow-y:auto; padding-right:4px;">
          ${largeScopes.length > 0 ? `
            <div>
              <p style="font-size:0.75rem; color:var(--primary); font-weight:700; margin-bottom:8px; text-transform:uppercase; letter-spacing:0.5px;">Phát sinh lớn (Tách thẻ riêng):</p>
              <div style="display:flex; flex-direction:column; gap:8px;">
                ${largeScopes.map(p => `
                  <div style="background-color:rgba(255,255,255,0.02); border:1px solid var(--border-color); border-radius:12px; padding:12px;">
                    <div style="font-size:0.85rem; font-weight:700; color:var(--text-primary);"><i class="fas fa-folder-plus" style="color:var(--status-pending); margin-right:4px;"></i> ${p.name}</div>
                    <div style="font-size:0.72rem; color:var(--text-muted); margin-top:4px;">Hạn hoàn thành: ${p.deadline}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          ${smallScopes.length > 0 ? `
            <div>
              <p style="font-size:0.75rem; color:var(--primary); font-weight:700; margin-bottom:8px; text-transform:uppercase; letter-spacing:0.5px;">Phát sinh nhỏ (Nhiệm vụ con):</p>
              <div style="display:flex; flex-direction:column; gap:8px;">
                ${smallScopes.map(t => {
                  const worker = db.users.find(u => u.id === t.assignedTo);
                  return `
                    <div style="background-color:rgba(255,255,255,0.02); border:1px solid var(--border-color); border-radius:12px; padding:12px; display:flex; justify-content:space-between; align-items:center; gap:12px;">
                      <div>
                        <div style="font-size:0.85rem; font-weight:700; color:var(--text-primary);"><i class="fas fa-plus-circle" style="color:var(--status-pending); margin-right:4px;"></i> ${t.taskTitle}</div>
                        <div style="font-size:0.78rem; color:var(--primary); font-weight:600; margin-top:4px;">Dự án: ${t.projectName}</div>
                        <div style="font-size:0.72rem; color:var(--text-muted); margin-top:2px;">Phụ trách: ${worker ? worker.name : 'Chưa giao'}</div>
                      </div>
                      <div>
                        <span class="status-badge ${t.status === 'completed' ? 'approved' : 'pending'}" style="font-size:0.7rem;">
                          ${t.status === 'completed' ? 'Đã xong' : 'Chưa xong'}
                        </span>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      `;
    }

    Modal.create('Chi Tiết: Nhãn Cam [PHÁT SINH]', html);
  },

  // 12.7 OPEN MANAGER ADD LOG MODAL
  openManagerAddLogModal(projectId, user, onComplete) {
    const project = DB.getProject(projectId);
    if (!project) return;

    const html = `
      <form id="manager-add-log-form" style="display:flex; flex-direction:column; gap:16px;">
        <div>
          <label class="form-label">Tên công trình</label>
          <input type="text" class="form-input" value="${project.name}" disabled style="padding-left:14px;">
        </div>

        <div>
          <label class="form-label">Tình trạng tiến độ ngày hôm nay</label>
          <div style="display:flex; gap:16px; margin-top:4px;">
            <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
              <input type="radio" name="manager-log-status" value="on_track" checked style="accent-color:var(--status-approved); width:18px; height:18px;">
              <span>Đúng tiến độ ✅</span>
            </label>
            <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
              <input type="radio" name="manager-log-status" value="delayed" style="accent-color:var(--status-rejected); width:18px; height:18px;">
               <span>Bị chậm ⚠️</span>
            </label>
          </div>
        </div>

        <div>
          <label class="form-label">Chi tiết công việc / Ghi chú lý do nếu chậm</label>
          <textarea id="manager-log-note" class="form-textarea" placeholder="Nhập ghi chú tình hình thi công/lắp đặt hôm nay..." required></textarea>
        </div>

        <div>
          <label class="form-label">Hình ảnh thực tế công việc (Không bắt buộc với sếp)</label>
          <div class="photo-uploader" id="manager-log-photo-uploader">
            <i class="fas fa-camera"></i>
            <p style="font-size:0.85rem; margin-top:4px; font-weight:500;">Tải hình ảnh thực tế</p>
            <input type="file" id="manager-log-photo-file-input" accept="image/*" multiple style="display:none;">
          </div>
          <div class="upload-preview-container" id="manager-log-preview-container"></div>
        </div>

        <button type="submit" class="btn-primary" style="margin-top:12px; background:linear-gradient(135deg, var(--primary), #9E815B);">
          Gửi Báo Cáo
        </button>
      </form>
    `;

    const modal = Modal.create('Thêm Báo Cáo Tiến Độ', html);
    const previewContainer = document.getElementById('manager-log-preview-container');
    const uploader = document.getElementById('manager-log-photo-uploader');
    const fileInput = document.getElementById('manager-log-photo-file-input');
    let selectedPhotos = [];

    uploader.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', async (e) => {
      const files = Array.from(e.target.files);
      if (selectedPhotos.length + files.length > 5) {
        Toast.info('Tải lên tối đa 5 hình ảnh.');
        return;
      }

      Toast.info('Đang nén và xử lý hình ảnh...');
      for (const file of files) {
        try {
          const base64Img = await this.compressImage(file);
          selectedPhotos.push(base64Img);
        } catch (err) {
          console.error(err);
          Toast.error('Không thể đọc hoặc xử lý ảnh: ' + file.name);
        }
      }
      this.updatePhotoPreviews(selectedPhotos, previewContainer);
      fileInput.value = '';
    });

    document.getElementById('manager-add-log-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const status = document.querySelector('input[name="manager-log-status"]:checked').value;
      const note = document.getElementById('manager-log-note').value;

      try {
        const db = DB.load();
        const proj = db.projects.find(p => p.id === projectId);
        if (proj) {
          const logId = 'log_' + Math.random().toString(36).substr(2, 9);
          const newLog = {
            id: logId,
            date: new Date().toISOString().split('T')[0],
            reporterId: user.id,
            reporterName: user.name,
            reporterRole: user.role,
            status: status,
            note: note,
            photos: selectedPhotos
          };

          proj.dailyLogs.unshift(newLog);

          const hist = {
            timestamp: new Date().toISOString(),
            action: `Sếp gửi báo cáo: Trạng thái [${status === 'on_track' ? 'Đúng tiến độ' : 'Bị chậm'}]`,
            user: user.name
          };
          proj.history.push(hist);

          DB.save(db);
          DB.sbInsertDailyLog(newLog, proj.id);
          DB.sbInsertHistory(hist, proj.id);
          Toast.success('Thêm báo cáo thành công!');
          modal.close();
          onComplete();
        }
      } catch (err) {
        Toast.error(err.message);
      }
    });
  }
};
