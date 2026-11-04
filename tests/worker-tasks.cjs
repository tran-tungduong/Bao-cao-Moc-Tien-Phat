const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const artifactDir = process.env.WORKER_UI_ARTIFACT_DIR || path.join(require('node:os').tmpdir(), 'moc-tien-phat-worker-ui');
fs.mkdirSync(artifactDir, {recursive:true});
const runtime = 'C:/Users/Duong/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/';
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || runtime + 'playwright');

(async () => {
  const server = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end('<!doctype html><html lang="vi"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="toast-container"></div><div id="app"><div class="app-shell"><header class="app-header"><div class="header-title">Mộc Tiên Phát</div><span class="user-role-tag">Nhân sự</span></header><main id="app-body-content" class="app-body"></main></div></div></body></html>');
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({headless: true, channel: 'msedge'});
    const page = await browser.newPage({viewport: {width: 390, height: 844}});
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
    await page.goto('http://127.0.0.1:' + server.address().port);
    await page.addStyleTag({content: fs.readFileSync('css/style.css', 'utf8')});
    await page.addStyleTag({content: '.fade-in{animation:none!important;opacity:1!important}#toast-container{display:none!important}'});
    await page.addScriptTag({content: fs.readFileSync('js/db.js', 'utf8').replace('export const DB =', 'const DB =') + '\nwindow.DB=DB;'});
    await page.addScriptTag({content: fs.readFileSync('js/components.js', 'utf8').replaceAll('export const ', 'const ') + '\nwindow.Toast=Toast; window.Modal=Modal;'});
    await page.addScriptTag({content: "window.PushNotifications={emitEvent:async()=>true,isEnabled:async()=>false,syncExistingSubscription:async()=>false};"});
    // Dispatch module stubs: no plan for today unless a test sets DB.dispatchGrants.
    await page.addScriptTag({content: "window.loadTodayDispatch=async()=>null; window.DispatchView={render(){},refresh(){}}; window.DispatchStore={load:async d=>({date:d,workers:{},report:{rows:[]}})};"});
    await page.addScriptTag({content: fs.readFileSync('js/ui.js', 'utf8').replace(/^import .*;\r?\n/gm, '').replaceAll('export const ', 'const ') + '\nwindow.UI=UI;'});
    await page.evaluate(() => {
      const users = [{id:'usr_luan',role:'manager',name:'Sếp'},{id:'lead',role:'lead_worker',name:'Trần Nhật Cường (Thợ chính)'},{id:'other',role:'lead_worker',name:'Anh A'},{id:'assistant',role:'assistant_worker',name:'Thợ phụ'}];
      const makeProject = (id,name,subtasks,dailyLogs=[]) => ({id,name,step:3,assignees:['lead','assistant'],isCompleted:false,scope:[{room:'Phòng bếp',item:'Cả phòng'}],subtasks,dailyLogs,history:[]});
      const task = (id,title,assignedTo='lead') => ({id,title,assignedTo,status:'pending',items:[],type:'normal'});
      const fixture = {users,attendance:[],systemLogs:[],projects:[
        makeProject('p1','NHÀ ANH MINH',[task('t1','[Phòng bếp - Cả phòng]: Lắp tủ bếp dưới'),task('t2','[Phòng ngủ - Tủ áo]: Lắp tủ quần áo'),task('t3','[Phòng bếp - Cả phòng]: Việc của người khác','other'),task('ta','[Phòng bếp - Cả phòng]: Việc độc lập','assistant')],[
          {id:'old',date:'2026-10-26',createdAt:'2026-10-26T10:00:00Z',reporterId:'other',approved:true,items:[{taskId:'t1',room:'Phòng bếp',item:'Cả phòng',pendingNotes:'Nội dung cũ'}]},
          {id:'latest',date:'2026-10-27',createdAt:'2026-10-27T10:00:00Z',reporterId:'other',approved:true,items:[{taskId:'t1',room:'Phòng bếp',item:'Cả phòng',pendingNotes:'Lắp 3 cánh tủ và đi silicone.'}]},
          {id:'pending',date:'2026-10-28',createdAt:'2026-10-28T10:00:00Z',reporterId:'assistant',reporterName:'Thợ phụ',approved:false,approverId:'lead',note:'Chờ duyệt',photos:[],items:[{taskId:'t1',pendingNotes:'Không được thay bàn giao đã duyệt'}]}
        ]), makeProject('p2','NHÀ CHỊ LAN',[task('t4','[Phòng khách - Cả phòng]: Thay ray ngăn kéo')]) ]};
      window.fixture = fixture;
      localStorage.setItem('furni_report_db',JSON.stringify(fixture));
      window.worker=users[1]; localStorage.setItem('furni_session',JSON.stringify(worker));
      window.writes=[];
      for(const method of ['sbUpdateSubtask','sbInsertSubtask','sbInsertDailyLog','sbInsertHistory']) DB[method]=async(...args)=>{writes.push({method,args});};
      DB.uploadPhotoToStorage=async()=> 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=';
      UI.compressImage=async()=> 'data:image/jpeg;base64,aW1hZ2U=';
      UI.renderShell(worker,()=>{});
      UI.renderWorkerView(worker);
    });
    assert.equal(await page.locator('.worker-project-group').count(),2);
    assert.equal(await page.locator('.worker-task-report-btn').count(),3);
    assert.equal(await page.locator('#daily-log-form').isVisible(),false);
    assert.equal(await page.getByText('Lắp 3 cánh tủ và đi silicone.',{exact:true}).count(),1);
    assert.equal(await page.locator('.worker-task-card').filter({hasText:'Việc của người khác'}).count(),0);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth > innerWidth),false);
    for (const width of [320,360,390,430]) {
      await page.setViewportSize({width,height:844});
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth > innerWidth),false);
      assert.equal(await page.locator('.app-header').evaluate(el=>el.scrollWidth>el.clientWidth),false);
      assert.ok(await page.locator('.worker-task-report-btn').first().evaluate(el=>el.getBoundingClientRect().height)>=44);
    }
    await page.setViewportSize({width:390,height:844});
    console.log('PASS mobile groups, assigned tasks, approved cross-worker handover, no overflow');
    await page.setViewportSize({width:390,height:1800});
    await page.screenshot({path:path.join(artifactDir,'worker-tasks-mobile.png'),fullPage:true});
    await page.setViewportSize({width:390,height:844});
    await page.locator('[data-task="t2"]').click();
    assert.equal(await page.locator('.select-chk-task').inputValue(),'t2');
    assert.equal(await page.locator('.select-chk-task').isVisible(),false);
    assert.equal(await page.locator('#log-project-id').isVisible(),false);
    assert.equal(await page.locator('.select-chk-room').inputValue(),'Phòng ngủ');
    assert.equal(await page.locator('.select-chk-room').isDisabled(),true);
    assert.equal(await page.locator('#btn-add-checklist-item').isVisible(),false);
    await page.locator('.txt-chk-today-work').fill('Đã lắp khung tủ');
    await page.evaluate(()=>UI.refreshActiveView(worker));
    assert.equal(await page.locator('.txt-chk-today-work').inputValue(),'Đã lắp khung tủ');
    page.once('dialog',d=>d.dismiss());
    await page.locator('#worker-back-to-tasks').click();
    assert.equal(await page.locator('.txt-chk-today-work').inputValue(),'Đã lắp khung tủ');
    console.log('PASS exact task binding, missing scope room, no duplicate selection, refresh/back preserve draft');
    await page.locator('#log-photo-file-input').setInputFiles({name:'fixture.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64')});
    await page.waitForFunction(()=>document.querySelector('#log-preview-container img'));
    await page.locator('#daily-log-form button[type=submit]').click();
    assert.equal(await page.evaluate(()=>writes.length),0);
    await page.locator('.txt-chk-pending-notes').fill('Còn lắp cánh tủ');
    await page.setViewportSize({width:390,height:1600});
    await page.screenshot({path:path.join(artifactDir,'worker-task-report-mobile.png'),fullPage:true});
    await page.setViewportSize({width:390,height:844});
    await page.locator('#daily-log-form button[type=submit]').click();
    await page.waitForSelector('.worker-task-report-btn');
    const saved=await page.evaluate(()=>DB.getProject('p1'));
    assert.equal(saved.dailyLogs[0].items[0].taskId,'t2');
    assert.equal(saved.dailyLogs[0].items[0].item,'Tủ áo');
    assert.equal(saved.subtasks.find(t=>t.id==='t2').status,'pending');
    assert.equal(saved.subtasks.find(t=>t.id==='t1').status,'pending');
    assert.match(await page.locator('.worker-task-card').filter({hasText:'Lắp tủ quần áo'}).innerText(),/Đã báo cáo hôm nay/);
    console.log('PASS incomplete report requires remaining work, no invalid writes, saves exact task and item');
    await page.locator('[data-task="t2"]').click();
    await page.locator('.txt-chk-today-work').fill('Đã lắp cánh tủ');
    await page.locator('.chk-item-completed').check();
    await page.locator('#log-photo-file-input').setInputFiles({name:'fixture.png',mimeType:'image/png',buffer:Buffer.from('fixture')});
    await page.waitForFunction(()=>document.querySelector('#log-preview-container img'));
    await page.locator('#daily-log-form button[type=submit]').click();
    await page.locator('[data-filter="completed"]').click();
    assert.equal(await page.locator('.worker-task-report-btn').count(),1);
    assert.match(await page.locator('.worker-task-card').innerText(),/Lắp tủ quần áo/);
    await page.locator('#tab-edit-reports').click();
    assert.equal(await page.locator('#worker-task-board').isVisible(),false);
    assert.ok(await page.locator('.btn-edit-my-log').count()>0);
    await page.locator('#tab-create-report').click();
    assert.equal(await page.locator('#worker-task-board').isVisible(),true);
    console.log('PASS completed filter and report history');
    await page.evaluate(()=>{ localStorage.setItem('furni_report_db',JSON.stringify(fixture)); window.worker=fixture.users[3]; DB.setSelectedLeadWorkerForAssistant(worker.id,''); UI.renderWorkerView(worker); });
    assert.equal(await page.locator('.worker-task-report-btn').count(),0);
    await page.locator('#worker-lead-selector').selectOption('independent');
    assert.equal(await page.locator('.worker-task-report-btn').count(),1);
    await page.locator('#worker-lead-selector').selectOption('lead');
    assert.equal(await page.locator('.worker-task-report-btn').count(),5);
    await page.locator('[data-task="t1"]').click();
    await page.locator('.txt-chk-today-work').fill('Đã hỗ trợ lắp tủ');
    await page.locator('.chk-item-completed').check();
    await page.locator('#log-photo-file-input').setInputFiles({name:'fixture.png',mimeType:'image/png',buffer:Buffer.from('fixture')});
    await page.waitForFunction(()=>document.querySelector('#log-preview-container img'));
    await page.locator('#daily-log-form button[type=submit]').click();
    const reviewed=await page.evaluate(()=>DB.getProject('p1'));
    assert.equal(reviewed.dailyLogs[0].approved,true);
    assert.equal(reviewed.dailyLogs[0].approverId,'lead');
    assert.equal(reviewed.subtasks.find(t=>t.id==='t1').status,'completed');
    console.log('PASS assistant mode visibility; report with a lead is a shared report that counts immediately (no approval wait)');
    await page.evaluate(()=>{ localStorage.setItem('furni_report_db',JSON.stringify(fixture)); window.worker=fixture.users[3]; UI.renderWorkerView(worker); });
    assert.equal(await page.locator('.crew-top-tabs').count(),0);
    await page.evaluate(()=>{
      const crew=[{id:'usr_luan',role:'manager',name:'Sếp'},{id:'usr_cuong',role:'lead_worker',name:'Trần Nhật Cường (Thợ chính)'},{id:'usr_ut',role:'lead_worker',name:'Út Út (Thợ chính)'},{id:'usr_minhnhat',role:'assistant_worker',name:'Minh Nhật (Thợ phụ)'},{id:'usr_bom',role:'assistant_worker',name:'Bom (Thợ phụ)'},{id:'usr_tai',role:'assistant_worker',name:'Tài (Thợ phụ)'}];
      const task=(id,title,assignedTo)=>({id,title,assignedTo,status:'pending',items:[],type:'normal'});
      const proj=(id,name,subtasks,dailyLogs)=>({id,name,step:3,assignees:crew.map(u=>u.id),isCompleted:false,scope:[],subtasks,dailyLogs,history:[]});
      const log=(id,reporterId,approverId,taskId,work,time,extra={})=>({id,date:'2026-10-28',createdAt:'2026-10-28T'+time+':00Z',reporterId,reporterName:crew.find(u=>u.id===reporterId).name,reporterRole:crew.find(u=>u.id===reporterId).role,approverId,approved:true,photos:['x'],items:[{taskId,room:'Phòng bếp',item:'Cả phòng',todayWork:work,isCompleted:false,pendingNotes:'Còn cánh tủ'}],...extra});
      const db={users:crew,attendance:[],systemLogs:[],projects:[
        proj('pm','NHÀ ANH MINH',[task('k1','[Phòng bếp - Cả phòng]: Lắp tủ bếp dưới','usr_cuong'),task('k2','[Phòng khách - Cả phòng]: Lắp kệ tivi','usr_cuong'),task('n1','[Phòng ngủ - Tủ áo]: Dán cạnh','usr_minhnhat'),{...task('n0','[Phòng ngủ - Cả phòng]: Việc cũ đã xong','usr_minhnhat'),status:'completed',completedAt:'2026-10-20T03:00:00Z'}],[
          log('m1','usr_minhnhat','usr_cuong','k1','Minh Nhật lắp khung tủ','09:00'),
          log('b1','usr_bom','usr_cuong','k1','Bom bắn vít hậu tủ','09:30')]),
        proj('pl','NHÀ CHỊ LAN',[task('l1','[Phòng khách - Cả phòng]: Thay ray ngăn kéo','usr_ut')],[
          log('u1','usr_ut','','l1','Út thay ray','10:00'),
          log('t1','usr_tai','independent','l1','Tài lau dọn','10:30')])]};
      localStorage.setItem('furni_report_db',JSON.stringify(db));
      window.crewDb=db; window.worker=crew[3]; DB.setSelectedLeadWorkerForAssistant(worker.id,'independent'); UI.crewBoardDate=null; UI.renderWorkerView(worker);
    });
    // No "Tổng hợp báo cáo" tab any more: the "Báo cáo" board shows the crew's day, with a day picker
    assert.equal(await page.locator('.crew-top-tabs').count(),0);
    assert.equal(await page.locator('#worker-lead-selector').count(),0);
    const cards=page.locator('.crew-day-card');
    const card=name=>cards.filter({hasText:name});
    // Today, no dispatch plan: each crew member's open tasks; Bom/Tài are not in the crew
    assert.equal(await cards.count(),4);
    assert.equal(await page.locator('.crew-day-card.is-mine').count(),1);
    assert.match(await page.locator('.crew-day-card.is-mine').innerText(),/Việc của bạn[\s\S]*Dán cạnh/);
    assert.match(await card('Lắp tủ bếp dưới').innerText(),/Phụ trách: Trần Nhật Cường[\s\S]*Chưa báo cáo/);
    assert.equal(await card('Dán cạnh').locator('.crew-day-btn').innerText(),'Báo cáo');
    assert.deepEqual(await card('Lắp kệ tivi').locator('.crew-day-btn').allInnerTexts(),['Tôi làm cùng','Báo cáo thay Trần Nhật Cường']);
    assert.deepEqual(await page.locator('.crew-day-chip').allInnerTexts(),['⏳ Trần Nhật Cường','⏳ Út Út','⏳ Minh Nhật']);
    // With today's dispatch plan, old backlog is still listed; dispatched jobs are tagged "Hôm nay"
    await page.evaluate(()=>{ DB.setDispatchGrants(DB.vnToday(),{usr_cuong:{attendance:'Có làm',rows:[{projectId:'pm',kind:'task',taskId:'k2',task:'Lắp kệ tivi'}]}}); UI.renderWorkerView(worker); });
    assert.equal(await cards.count(),4);
    assert.equal(await page.locator('.crew-day-today').count(),1);
    assert.match(await card('Lắp kệ tivi').innerText(),/Hôm nay/);
    assert.match(await card('Thay ray ngăn kéo').innerText(),/Phụ trách: Út Út/);
    await page.evaluate(()=>{ DB.dispatchGrants=null; UI.renderWorkerView(worker); });
    // Earlier day: read-only, the jobs reported that day with their lines
    await page.locator('#crew-day-date').fill('2026-10-28');
    await page.locator('#crew-day-date').dispatchEvent('change');
    await page.waitForFunction(()=>/28\/10\/2026/.test(document.querySelector('.crew-day-head h2')?.textContent||''));
    assert.equal(await page.locator('.crew-day-btn').count(),0);
    assert.equal(await cards.count(),2);
    const k1=card('Lắp tủ bếp dưới');
    assert.match(await k1.getAttribute('class'),/is-mine/);
    assert.match(await k1.innerText(),/Đã báo cáo · còn việc[\s\S]*Minh Nhật[\s\S]*làm cùng Trần Nhật Cường[\s\S]*Minh Nhật lắp khung tủ[\s\S]*Còn: Còn cánh tủ/);
    assert.doesNotMatch(await k1.innerText(),/Bom bắn vít/);
    assert.match(await card('Thay ray ngăn kéo').innerText(),/Út Út[\s\S]*Út thay ray/);
    assert.deepEqual(await page.locator('.crew-day-chip').allInnerTexts(),['⏳ Trần Nhật Cường','✅ Út Út','✅ Minh Nhật']);
    await k1.locator('.crew-day-photo').click();
    assert.equal(await page.locator('.modal-drawer').isVisible(),true);
    await page.evaluate(()=>document.querySelectorAll('.modal-overlay, .modal-drawer').forEach(e=>e.remove()));
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth > innerWidth),false);
    // Back to today: report on behalf of Cường
    await page.locator('#crew-day-today').click();
    const proxyBtn=card('Lắp kệ tivi').locator('.crew-day-btn',{hasText:'Báo cáo thay'});
    await proxyBtn.click();
    assert.match(await page.locator('#modal-dialog-title').innerText(),/Báo cáo thay Trần Nhật Cường/);
    await page.locator('#crew-report-form button[type=submit]').click();
    assert.equal(await page.evaluate(()=>DB.load().projects[0].dailyLogs.length),2);
    await page.locator('#crew-rf-work').fill('Bắt vít kệ tivi');
    await page.locator('#crew-rf-left').fill('Còn lắp kính');
    await page.locator('#crew-rf-photos').setInputFiles({name:'k.png',mimeType:'image/png',buffer:Buffer.from('k')});
    await page.waitForFunction(()=>document.querySelector('#crew-rf-preview img'));
    await page.locator('#crew-report-form button[type=submit]').click();
    const proxied=await page.evaluate(()=>{ const p=DB.load().projects[0]; return {log:p.dailyLogs[0], task:p.subtasks.find(t=>t.id==='k2')}; });
    assert.equal(proxied.log.reporterId,'usr_cuong');
    assert.equal(proxied.log.approved,true);
    assert.equal(proxied.log.items[0].taskId,'k2');
    assert.equal(proxied.log.items[0].submittedById,'usr_minhnhat');
    assert.equal(proxied.task.status,'pending');
    assert.equal(proxied.task.items[0].pendingNotes,'Còn lắp kính');
    assert.match(await card('Lắp kệ tivi').innerText(),/Đã báo cáo · còn việc[\s\S]*Trần Nhật Cường[\s\S]*Minh Nhật báo thay[\s\S]*Bắt vít kệ tivi/);
    // "Tôi làm cùng" on Út's task: Minh Nhật's own report, recorded with Út
    await card('Thay ray ngăn kéo').locator('.crew-day-btn',{hasText:'Tôi làm cùng'}).click();
    assert.match(await page.locator('#modal-dialog-title').innerText(),/làm cùng Út Út/);
    await page.locator('#crew-rf-work').fill('Phụ thay ray');
    await page.locator('#crew-rf-done').check();
    await page.locator('#crew-rf-photos').setInputFiles({name:'r.png',mimeType:'image/png',buffer:Buffer.from('r')});
    await page.waitForFunction(()=>document.querySelector('#crew-rf-preview img'));
    await page.locator('#crew-report-form button[type=submit]').click();
    const withLog=await page.evaluate(()=>DB.load().projects[1].dailyLogs[0]);
    assert.equal(withLog.reporterId,'usr_minhnhat');
    assert.equal(withLog.approverId,'usr_ut');
    assert.equal(withLog.items[0].taskId,'l1');
    console.log('PASS crew board: whole crew per day, own jobs highlighted, day picker review, report / làm cùng / báo cáo thay');
    await page.setViewportSize({width:1440,height:1000});
    await page.evaluate(()=>{window.worker=fixture.users[1];UI.renderWorkerView(worker);document.documentElement.setAttribute('data-theme','light');});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth > innerWidth),false);
    await page.screenshot({path:path.join(artifactDir,'worker-tasks-desktop-light.png'),fullPage:true});
    assert.deepEqual(errors,[]);
    console.log('PASS desktop/light theme and no browser exceptions; all data and network isolated');
  } finally {if(browser) await browser.close(); await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1});
