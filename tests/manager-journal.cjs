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
    await page.addScriptTag({content: fs.readFileSync('js/ui.js', 'utf8').replace(/^import .*;\r?\n/gm, '').replaceAll('export const ', 'const ') + '\nwindow.UI=UI;'});
    await page.clock.install({time:new Date('2026-10-28T02:00:00Z')});
    await page.evaluate(() => {
      const users=[{id:'usr_luan',role:'manager',name:'ADMIN'},{id:'usr_long',role:'kts',name:'Nhật Long'},{id:'usr_hai',role:'sales',name:'Hải Tạ'},{id:'usr_duong',role:'marketing',name:'Tùng Dương'},{id:'worker',role:'lead_worker',name:'Cường'}];
      const log=(id,date,time,work,remaining,done=false,approved=true)=>({id,date,createdAt:`${date}T${time}:00Z`,reporterId:'worker',reporterName:'Cường',reporterRole:'lead_worker',approved,status:'on_track',note:'Nội dung cũ',photos:[],items:[{taskId:'t1',room:'Phòng bếp',item:'Cả phòng',todayWork:work,pendingNotes:remaining,isCompleted:done}]});
      const project=(id,name,dailyLogs)=>({id,name,step:3,deadline:'2026-11-10',originalDeadline:'2026-11-10',isCompleted:false,assignees:['worker'],scope:[{room:'Phòng bếp',item:'Cả phòng'}],subtasks:[{id:'t1',title:'[Phòng bếp - Cả phòng]: Lắp tủ bếp',assignedTo:'worker',status:'pending',items:[]}],dailyLogs,history:[]});
      const fixture={users,attendance:[],systemLogs:[],projects:[project('p1','Bếp chợ mai',[
        log('morning','2026-10-28','01:00','Đã lắp khung tủ','Còn lắp cánh'),
        log('later','2026-10-28','02:00','Đã lắp cánh tủ','',true),
        log('awaiting','2026-10-28','03:00','Nội dung chưa duyệt','Không xuất tóm tắt',false,false)
      ]),project('p2','Bàn thờ Đặng Văn Ngữ',[log('yesterday','2026-10-27','10:00','Đã cắt gỗ','Còn lắp ráp')])]};
      window.fixture=fixture;window.manager=users[0];
      localStorage.setItem('furni_report_db',JSON.stringify(fixture));
      localStorage.setItem('furni_session',JSON.stringify(manager));
      UI.renderGeneralManagement=()=>{document.getElementById('manager-tab-content').innerHTML='<div>Tổng quan</div>';};
      window.opened=[];UI.openLogDetailModal=(log,project)=>opened.push({log:log.id,project:project.id});
      UI.renderShell(manager,()=>{});UI.renderManagerView(manager);
    });
    await page.locator('#tab-logs-btn').click();
    assert.equal(await page.locator('#filter-log-date').inputValue(),'2026-10-28');
    assert.equal(await page.locator('.journal-project').count(),1);
    assert.equal(await page.locator('.manager-log-card').count(),2);
    assert.match(await page.locator('#journal-overview').innerText(),/2 báo cáo · 1 công trình · 1 nhân sự/);
    assert.equal(await page.evaluate(()=>UI.getJournalDate(new Date('2026-10-27T18:30:00Z'))),'2026-10-28');
    assert.equal(await page.locator('.journal-summary, #journal-copy-summary, #journal-copy-sheet').count(),0);
    assert.equal(await page.locator('.journal-assigned-task').count(),0);
    assert.equal(await page.locator('.journal-current-task').count(),2);
    assert.equal(await page.locator('.journal-done-work').count(),2);
    assert.match(await page.locator('.journal-current-task').first().innerText(),/Lắp tủ bếp/);
    assert.match(await page.locator('.journal-report-scope').first().innerText(),/Phòng bếp/);
    assert.match(await page.locator('.journal-done-work').first().innerText(),/Đã lắp cánh tủ/);
    assert.equal(await page.locator('.journal-previous-report').count(),1);
    assert.match(await page.locator('.journal-previous-report').innerText(),/Còn lắp cánh/);
    assert.doesNotMatch(await page.locator('#filtered-logs-list').innerText(),/Nội dung chưa duyệt|Đã cắt gỗ|Nhiệm vụ cũ|báo cáo hiện tại/);
    const independent=await page.evaluate(()=>UI.getJournalRows({items:[{room:'Bàn thờ',item:'Cả phòng',todayWork:'Đã lắp khung',isCompleted:false}]},fixture.projects[0]));
    assert.equal(independent[0].task,'Báo cáo công việc');assert.equal(independent[0].room,'Bàn thờ');assert.equal(independent[0].work,'Đã lắp khung');
    const screenshotCase=await page.evaluate(()=>UI.getJournalRows({id:'now',date:'2026-10-23',items:[{taskId:'install',room:'lắp ráp hoàn thiện tại công trình',item:'Cả phòng',todayWork:'lắp ráp tủ cầu thang, vệ sinh',isCompleted:true}]},{subtasks:[{id:'install',title:'lắp ráp'}],dailyLogs:[]}));
    assert.equal(screenshotCase[0].task,'lắp ráp');assert.equal(screenshotCase[0].room,'lắp ráp hoàn thiện tại công trình');assert.equal(screenshotCase[0].previousRemaining,'');
    const historyCases=await page.evaluate(()=>{
      const project={subtasks:[{id:'x',title:'Nhiệm vụ thật'}],dailyLogs:[
        {id:'other',date:'2026-10-20',approved:true,items:[{taskId:'other',room:'Cùng phòng',pendingNotes:'Sai nhiệm vụ'}]},
        {id:'pending',date:'2026-10-21',approved:false,items:[{taskId:'x',pendingNotes:'Chưa được duyệt'}]},
        {id:'finished',date:'2026-10-22',approved:true,items:[{taskId:'x',pendingNotes:'Nội dung thừa đã xong',isCompleted:true}]}
      ]};
      const current={id:'now',date:'2026-10-23',items:[{taskId:'x',room:'Cùng phòng',todayWork:'Đang làm tiếp'}]};
      const finished=UI.getJournalRows(current,project)[0].previousRemaining;
      project.dailyLogs=project.dailyLogs.filter(l=>l.id!=='finished');
      const unrelated=UI.getJournalRows(current,project)[0].previousRemaining;
      project.dailyLogs=[{id:'unknown-order',date:'2026-10-23',items:[{taskId:'x',pendingNotes:'Không rõ thứ tự cùng ngày'}]}];
      return {finished,unrelated,unknownOrder:UI.getJournalRows(current,project)[0].previousRemaining};
    });
    assert.deepEqual(historyCases,{finished:'',unrelated:'',unknownOrder:''});
    console.log('PASS task identity separate from room; prior remaining work only from an earlier approved report of the same task');
    await page.locator('[data-view-log="0"]').click();await page.locator('[data-view-log="1"]').click();
    assert.deepEqual(await page.evaluate(()=>opened.map(x=>x.log)),['later','morning']);
    console.log('PASS today in Vietnam, approved reports only, grouped readable items, exact report detail IDs');
    await page.locator('#filter-log-date').fill('2026-10-27');await page.locator('#filter-log-date').dispatchEvent('change');
    assert.equal(await page.locator('.manager-log-card').count(),1);
    await page.evaluate(()=>UI.refreshActiveView(manager));
    assert.equal(await page.locator('#filter-log-date').inputValue(),'2026-10-27');
    await page.locator('#journal-today').click();
    assert.equal(await page.locator('#filter-log-date').inputValue(),'2026-10-28');
    await page.locator('#filter-log-project').selectOption('p2');
    assert.equal(await page.locator('.manager-log-card').count(),0);
    await page.locator('#filter-log-project').selectOption('all');
    await page.locator('#filter-log-reporter').selectOption('usr_luan');
    assert.equal(await page.locator('.manager-log-card').count(),0);
    await page.locator('#filter-log-reporter').selectOption('all');
    await page.locator('#filter-log-status').selectOption('delayed');
    assert.equal(await page.locator('.manager-log-card').count(),0);
    await page.locator('#filter-log-status').selectOption('all');
    await page.clock.setSystemTime(new Date('2026-10-28T18:00:00Z'));
    await page.evaluate(()=>UI.refreshActiveView(manager));
    assert.equal(await page.locator('#filter-log-date').inputValue(),'2026-10-29');
    await page.clock.setSystemTime(new Date('2026-10-28T02:00:00Z'));
    await page.locator('#journal-today').click();
    console.log('PASS filters, empty state, preserved historical selection, today refresh across midnight');
    for(const id of ['usr_luan','usr_long','usr_hai','usr_duong']) {
      await page.evaluate(id=>{window.manager=fixture.users.find(u=>u.id===id);UI.renderManagerView(manager);},id);
      assert.equal(await page.locator('#tab-logs-btn').count(),1);
      await page.locator('#tab-logs-btn').click();
      assert.equal(await page.locator('#filter-log-date').inputValue(),'2026-10-28');
      assert.equal(await page.locator('.btn-delete-log-from-tab').count(),id==='usr_duong'?0:2);
      assert.equal(await page.locator('.manager-log-card').count(),2);
    }
    console.log('PASS journal access for all four accounts; marketing has no delete control');
    await page.setViewportSize({width:1440,height:1100});
    await page.evaluate(()=>document.documentElement.setAttribute('data-theme','light'));
    await page.screenshot({path:path.join(artifactDir,'manager-journal-desktop.png'),fullPage:true});
    for(const width of [320,390,430]) {
      await page.setViewportSize({width,height:844});
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
      assert.equal(await page.locator('.manager-journal').evaluate(el=>el.scrollWidth>el.clientWidth),false);
    }
    await page.evaluate(()=>document.documentElement.setAttribute('data-theme','dark'));
    await page.setViewportSize({width:390,height:1800});
    await page.screenshot({path:path.join(artifactDir,'manager-journal-mobile.png'),fullPage:true});
    // A report with no structured items remains readable without inventing completion status.
    const legacy=await page.evaluate(()=>UI.getJournalRows({date:'2026-10-28',reporterName:'A',note:'Ghi chú cũ'},fixture.projects[0]));
    assert.equal(legacy[0].work,'Ghi chú cũ');assert.equal(legacy[0].status,'Chưa ghi trạng thái');
    assert.deepEqual(errors,[]);
    console.log('PASS mobile/desktop and light/dark layouts; legacy notes preserved; no browser exceptions');
  } finally {if(browser) await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1});
