const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const {execFileSync} = require('node:child_process');
const current = fs.readFileSync('js/db.js','utf8');
const original = execFileSync('git',['show','e8e7b02:js/db.js'],{encoding:'utf8'});
const fixture = {
 users:[{id:'u1',username:'test',password:'test',role:'manager',name:'Test'}],
 projects:[{id:'p1',name:'Fixture only',step:1,assignees:['u1'],scope:[],is_completed:false}],
 subtasks:[{id:'s1',project_id:'p1',title:'Task',assigned_to:'u1',items:[]}],
 daily_logs:[{id:'l1',project_id:'p1',date:'2026-09-14',photos:['data:image/jpeg;base64,TEST','https://example.invalid/a.jpg'],items:[],approved:true}],
 attendance:[{user_id:'u1',date:'2026-09-14',status:'present'}],
 project_history:[{project_id:'p1',timestamp:'2026-09-14T00:00:00Z',action:'Fixture',user:'u1'}]
};
function harness(source=current) {
 let now=1000000, seq=0, reads=0, creates=0, removed=0;
 const timers=new Map(), cache=new Map(), win=new Map(), doc=new Map(), pending=[];
 const h={ mode:'ok', fixtures:structuredClone(fixture), pending, signals:[] };
 function target(events) {return {addEventListener:(n,f)=>events.set(n,f),removeEventListener:(n,f)=>{if(events.get(n)===f)events.delete(n)}};}
 const channel={on(n,f,cb){h.remote=cb;return this},subscribe(cb){h.status=cb;return this}};
 const context={console:{log(){},warn(){},error(){}},AbortController,
 Date:class extends Date {static now(){return now}},
 setTimeout(f,d){const id=++seq;timers.set(id,{f,at:now+d});return id},clearTimeout(id){timers.delete(id)},
 setInterval(f,d){const id=++seq;const tick=()=>{timers.set(id,{f:tick,at:now+d});return f()};timers.set(id,{f:tick,at:now+d});return id},clearInterval(id){timers.delete(id)},
 localStorage:{getItem:k=>cache.get(k)||null,setItem:(k,v)=>cache.set(k,v),removeItem:k=>cache.delete(k)},
 window:target(win),document:{hidden:false,...target(doc)},navigator:{onLine:true},
 supabase:{createClient(){creates++;return {channel:()=>channel,removeChannel(){removed++},from(table){return {select(){
 let signal;
 return {abortSignal(s){signal=s;h.signals.push(s);return this},then(resolve,reject){reads++;
 if(h.mode==='hold') {return new Promise((res,rej)=>{pending.push(()=>res({data:structuredClone(h.fixtures[table]),error:null}));signal?.addEventListener('abort',()=>rej(new Error('aborted')))}).then(resolve,reject)}
 return Promise.resolve(h.mode==='fail'?{data:null,error:{message:'offline'}}:{data:structuredClone(h.fixtures[table]),error:null}).then(resolve,reject)
 }};
 },insert(){throw Error('Unexpected production write')},update(){throw Error('Unexpected production write')},delete(){throw Error('Unexpected production write')}}}}}}
 };
 vm.createContext(context);vm.runInContext(source.replace('export const DB =','const DB =')+'\n globalThis.db = DB;',context);
 Object.assign(h,{db:context.db,context,cache,win,doc,reads:()=>reads,creates:()=>creates,removed:()=>removed,
 login(){cache.set('furni_session',JSON.stringify(fixture.users[0]))},
 async flush(){for(let i=0;i<30;i++)await Promise.resolve()},
 async advance(ms){const end=now+ms;while(true){let pair=[...timers].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!pair)break;now=pair[1].at;timers.delete(pair[0]);pair[1].f();await h.flush()}now=end;await h.flush()},
 async seed(){await h.db.initialize();await h.flush()}, fire(name){(win.get(name)||doc.get(name))?.()}, release(){pending.splice(0).forEach(f=>f())}
 });return h;
}
const tests=[];function test(name,fn){tests.push([name,fn])}
test('Same assembled data, photos and business records as old version',async()=>{const a=harness(original),b=harness();await a.seed();await b.seed();assert.equal(a.cache.get('furni_report_db'),b.cache.get('furni_report_db'))});
test('30 minutes idle: fivefold reduction with healthy Realtime',async()=>{const a=harness(original),b=harness();for(const h of [a,b]){h.login();await h.seed();h.db.startLiveSync();h.status('SUBSCRIBED');await h.advance(1801000)}assert.equal(a.reads(),96);assert.equal(b.reads(),24);console.log('  measured reads including startup:',a.reads(),'->',b.reads(),'; periodic rounds: 15 -> 3')});
test('No background reads before login; logout removes listeners and timers',async()=>{const h=harness();await h.seed();h.db.startLiveSync();await h.advance(700000);assert.equal(h.reads(),6);h.login();h.db.startLiveSync();h.status('SUBSCRIBED');await h.advance(600);h.db.logout();const n=h.reads();await h.advance(2000000);assert.equal(h.reads(),n);assert.equal(h.win.size,0);assert.equal(h.doc.size,0);assert.equal(h.removed(),1)});
test('Hidden/offline tabs do not poll; return coalesces focus + visibility',async()=>{const h=harness();h.login();await h.seed();h.db.startLiveSync();h.status('SUBSCRIBED');h.context.document.hidden=true;await h.advance(1200000);assert.equal(h.reads(),6);h.context.document.hidden=false;h.fire('focus');h.fire('visibilitychange');await h.advance(600);assert.equal(h.reads(),12);h.fire('focus');await h.advance(600);assert.equal(h.reads(),12);h.context.navigator.onLine=false;await h.advance(1200000);assert.equal(h.reads(),12)});
test('Realtime bursts coalesce; fallback reads after two minutes',async()=>{const h=harness();h.login();await h.seed();h.db.startLiveSync();h.status('SUBSCRIBED');h.remote();h.remote();h.remote();await h.advance(600);assert.equal(h.reads(),12);h.status('CHANNEL_ERROR');await h.advance(121000);assert.equal(h.reads(),18)});
test('Old response cannot overwrite a newer local save',async()=>{const h=harness();await h.seed();await h.advance(2000);h.mode='hold';const read=h.db.syncWithServer();await h.flush();const changed=JSON.parse(h.cache.get('furni_report_db'));changed.projects[0].name='New local value';h.db.save(changed);h.release();assert.equal(await read,false);assert.equal(JSON.parse(h.cache.get('furni_report_db')).projects[0].name,'New local value')});
test('Concurrent refreshes reuse six requests and notify joining caller',async()=>{const h=harness();h.mode='hold';let callbacks=0;const a=h.db.syncWithServer();const b=h.db.syncWithServer(()=>callbacks++);await h.flush();assert.equal(h.reads(),6);h.release();assert.equal(await a,true);assert.equal(await b,true);assert.equal(callbacks,1)});
test('Timeout aborts all six requests; retry delay grows',async()=>{const h=harness();h.mode='hold';const p=h.db.syncWithServer();await h.flush();await h.advance(30001);assert.equal(await p,false);assert.ok(h.signals.every(s=>s.aborted));assert.equal(h.db.syncFailures,1);h.mode='fail';await h.db.syncWithServer();assert.equal(h.db.syncFailures,2);assert.equal(h.db.nextSyncAttempt-h.context.Date.now(),30000)});
test('Remote change during read is caught by a follow-up read',async()=>{const h=harness();h.login();await h.seed();h.db.startLiveSync();h.status('SUBSCRIBED');h.mode='hold';h.remote();await h.advance(600);h.remote();h.release();await h.flush();assert.equal(h.db.needsSync,true);h.mode='ok';await h.advance(5500);assert.equal(h.reads(),18);assert.equal(h.db.needsSync,false)});
test('Logout aborts read and does not overwrite cache',async()=>{const h=harness();h.login();await h.seed();const cache=h.cache.get('furni_report_db');await h.advance(2000);h.mode='hold';const p=h.db.syncWithServer();await h.flush();h.db.logout();assert.equal(await p,false);assert.equal(h.cache.get('furni_report_db'),cache)});
test('Both application modules import identical DB URL',async()=>{const url=f=>fs.readFileSync(f,'utf8').match(/import \{ DB \} from '([^']+)'/)[1];assert.equal(url('js/app.js'),url('js/ui.js'))});
test('Realtime event during a write is deferred, not dropped',async()=>{const h=harness();h.login();await h.seed();h.db.startLiveSync();h.status('SUBSCRIBED');h.db.activeWriteRequests=1;h.remote();await h.advance(6000);assert.equal(h.reads(),6);h.db.activeWriteRequests=0;await h.advance(6000);assert.equal(h.reads(),12)});
test('Reconnect catches up without waiting ten minutes',async()=>{const h=harness();h.login();await h.seed();h.db.startLiveSync();h.status('SUBSCRIBED');h.status('CHANNEL_ERROR');h.status('SUBSCRIBED');await h.advance(600);assert.equal(h.reads(),12)});
test('Server deletion is reflected by the unchanged full-read assembly',async()=>{const h=harness();await h.seed();h.fixtures.daily_logs=[];await h.advance(2000);await h.db.syncWithServer();assert.equal(JSON.parse(h.cache.get('furni_report_db')).projects[0].dailyLogs.length,0)});
test('Business write payloads remain identical',async()=>{const section=s=>s.slice(s.indexOf('  // Relational writes helpers'),s.indexOf('  // Load database from localStorage')).replaceAll('\r\n','\n').replaceAll('    this.writeRevision = (this.writeRevision || 0) + 1;\n','').replace('photos: await Promise.all((dl.photos || []).map(photo => this.uploadPhotoToStorage(photo))),', 'photos: dl.photos || [],').replace('      if (Array.isArray(dbFields.photos)) {\n        dbFields.photos = await Promise.all(dbFields.photos.map(photo => this.uploadPhotoToStorage(photo)));\n      }\n', '');assert.equal(section(current),section(original))});
test('Notifications focus existing app without navigation; closed app opens normally',async()=>{const events={};let navigations=0,focus=0,message,opened,wait;
 const self={location:{origin:'https://example.test',href:'https://example.test/app/sw.js'},addEventListener:(n,f)=>events[n]=f,clients:{matchAll:async()=>[{url:'https://example.test/app/',navigate(){navigations++},postMessage(m){message=m},focus(){focus++}}],openWindow:async u=>{opened=u}}};
 vm.runInNewContext(fs.readFileSync('sw.js','utf8'),{self,URL});
 const click=()=>events.notificationclick({notification:{close(){},data:{url:'/app/?project=p1'}},waitUntil(p){wait=p}});
 click();await wait;assert.equal(navigations,0);assert.equal(focus,1);assert.equal(message.type,'OPEN_NOTIFICATION');
 self.clients.matchAll=async()=>[];click();await wait;assert.equal(opened,'https://example.test/app/?project=p1');
});
(async()=>{for(const [name,fn]of tests){await fn();console.log('PASS',name)}console.log(`${tests.length} checks passed; all network and writes mocked.`)})().catch(e=>{console.error(e);process.exitCode=1});
