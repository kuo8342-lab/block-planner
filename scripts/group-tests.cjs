// Privacy tests execute the real c-group.js with an in-memory Firebase substitute.
// No user profile, real account, network message, clipboard or sharing API is used.
const fs=require('node:fs'),path=require('node:path');
const {evidenceUrl}=require('./test-config.cjs');
let pw;try{pw=require('playwright');}catch{pw=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));}
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-artifacts');fs.mkdirSync(out,{recursive:true});
const boot=String.raw`
window.__writes=[];window.__queries=[];window.__toasts=[];window.__confirm=[];
window.PACE_FIREBASE={projectId:'synthetic-offline-test'};
window.confirm=s=>(__confirm.push(s),true);window.toast=s=>__toasts.push(s);window.burst=()=>{};window.burstAt=()=>{};window.showAlarm=s=>__toasts.push(s);
const group={id:'TEST2345',name:'測試群組',members:['qa-user','qa-friend'],names:{'qa-user':'測試者','qa-friend':'測試朋友'}};
const snapshot=rows=>({docs:rows.map(x=>({id:x.id,data:()=>x,metadata:{hasPendingWrites:false}})),docChanges:()=>[]});
const mockfs={
 collection:(_,...p)=>({path:p.join('/')}),doc:(_,...p)=>({path:p.join('/')}),where:(...x)=>({where:x}),orderBy:(...x)=>({orderBy:x}),limit:n=>({limit:n}),query:(ref,...filters)=>({...ref,filters}),
 onSnapshot:(q,next)=>{__queries.push(q);if(q.path==='groups')setTimeout(()=>next(snapshot([group])),0);else setTimeout(()=>next(snapshot([
 {id:'fresh',uid:'qa-friend',name:'測試朋友',title:'合成完成事項',minutes:35,at:{toMillis:()=>Date.now()-60000},cheers:{}},
 {id:'old',uid:'qa-friend',name:'測試朋友',title:'八天前的事項',minutes:20,at:{toMillis:()=>Date.now()-8*864e5},cheers:{}},
 {id:'mine',uid:'qa-user',name:'測試者',title:'自己完成的事項',minutes:25,at:{toMillis:()=>Date.now()-120000},cheers:{}}
 ])),0);return()=>{};},
 setDoc:async(ref,data)=>{__writes.push({kind:'set',path:ref.path,data});},
 updateDoc:async(ref,data)=>{if(window.__reject){const e=new Error('synthetic rejection');e.code=__reject;throw e;}__writes.push({kind:'update',path:ref.path,data});},
 deleteDoc:async ref=>{__writes.push({kind:'delete',path:ref.path});},
 getDoc:async ref=>({exists:()=>true,data:()=>({...group,members:['qa-friend']})}),
 serverTimestamp:()=>({mockServerTime:true}),arrayUnion:v=>({union:v}),arrayRemove:v=>({remove:v}),deleteField:()=>({deleteField:true})
};
window.paceSync={onUser:fn=>{window.__auth=fn;setTimeout(()=>fn(null),0);},fb:()=>({fs:mockfs,db:{}})};
window.paceStore={paths:()=>[],read:()=>({d:null,t:0}),apply:()=>{},onWrite:fn=>{window.__localWrite=fn;return()=>{};}};
`;
fs.writeFileSync(path.join(out,'group-harness.html'),`<!doctype html><meta charset="utf-8"><body><section><div id="wishes"></div></section><dialog id="skinDlg"><h3 class="set-h">AI</h3></dialog><script>${boot}</script><script>${fs.readFileSync(path.join(root,'pace-build/c-group.js'),'utf8')}</script>`);
(async()=>{const browser=await pw.chromium.launch({headless:true});const context=await browser.newContext();let external=0;await context.route('**/*',r=>{if(new URL(r.request().url()).hostname==='127.0.0.1')return r.continue();external++;return r.abort();});const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.clock.install({time:new Date('2026-10-28T14:37:00+08:00')});await page.goto(evidenceUrl+'group-harness.html');
const checks=await page.evaluate(async()=>{
 const rows=[],ok=(name,pass)=>rows.push({name,pass:!!pass}),$=id=>document.getElementById(id),sleep=()=>new Promise(r=>setTimeout(r,50)),reset=()=>{__writes.length=0;};
 await sleep();ok('logged-out users cannot view group controls',$('grpOn').hidden&&!$('grpOff').hidden&&$('grpCard').hidden);$('grpNew').click();await sleep();ok('logged-out create is rejected with no writes',__writes.length===0&&$('grpMsg').textContent.includes('先登入'));
 await __auth({uid:'qa-user',displayName:'測試者'});await sleep();ok('signed-in group UI appears',!$('grpOn').hidden&&$('grpOff').hidden&&!$('grpCard').hidden);
 ok('feed shows only last seven days',$('grpFeed').textContent.includes('合成完成事項')&&!$('grpFeed').textContent.includes('八天前'));
 ok('own applause button disabled',document.querySelector('[data-cheer="TEST2345/mine"]').disabled);
 ok('queries never request private timelines',__queries.every(q=>q.path==='groups'||/^groups\/[^/]+\/feed$/.test(q.path)));
 const block=(id,done=true)=>({id,name:'PRIVATE synthetic task',day:2,start:'19:00',minutes:45,cat:'study',done,reflection:{text:'PRIVATE reflection'},apiKey:'SYNTHETIC_DO_NOT_LEAK'});
 reset();__localWrite('weeks/2026-10-26',{blocks:[block('normal')]});await sleep();const normal=__writes[0];ok('completed item writes only feed',normal?.kind==='set'&&normal.path==='groups/TEST2345/feed/qa-user_b-2026-10-26-normal');
 ok('completion payload only allowed public fields',Object.keys(normal?.data||{}).sort().join(',')==='at,cheers,minutes,name,title,uid');
 ok('schedule/reflection/key never leave via group payload',!JSON.stringify(__writes).includes('reflection')&&!JSON.stringify(__writes).includes('19:00')&&!JSON.stringify(__writes).includes('SYNTHETIC_DO_NOT_LEAK'));
 $('grpHide').checked=true;$('grpHide').dispatchEvent(new Event('change'));reset();__localWrite('tasks/hidden',{title:'PRIVATE hidden task',minutes:30,done:true});await sleep();ok('minutes-only preference omits task title',__writes.length===1&&__writes[0].data.title===''&&__writes[0].data.minutes===30&&!JSON.stringify(__writes).includes('PRIVATE'));
 $('grpShare').checked=false;$('grpShare').dispatchEvent(new Event('change'));reset();__localWrite('tasks/optout',{title:'PRIVATE opted out',minutes:15,done:true});await sleep();ok('share opt-out writes no completion',__writes.length===0);
 reset();__localWrite('weeks/2026-10-26',{blocks:[block('normal',false)]});await sleep();ok('undo completion retracts activity even after opt-out',__writes.some(w=>w.kind==='delete'&&w.path.endsWith('b-2026-10-26-normal')));
 $('grpShare').checked=true;$('grpShare').dispatchEvent(new Event('change'));reset();paceStore.apply('tasks/remote',{title:'remote',minutes:20,done:true},1);__localWrite('tasks/remote',{title:'remote',minutes:20,done:true});await sleep();ok('remote synced completion is not rebroadcast',__writes.length===0);
 reset();__localWrite('tasks/tour',{title:'example',minutes:20,done:true,tour:true});__localWrite('weeks/buffer',{blocks:[{...block('buffer'),cat:'buffer'}]});await sleep();ok('tour and buffer items are not shared',__writes.length===0);
 reset();document.querySelector('[data-cheer="TEST2345/fresh"]').click();await sleep();ok('applause updates only own cheer',__writes.length===1&&Object.keys(__writes[0].data).join(',')==='cheers.qa-user');
 reset();$('grpName').value='合成新群組';$('grpNew').click();await sleep();ok('new group has only self as member',__writes.length===1&&__writes[0].data.members.join(',')==='qa-user'&&/groups\/[A-Z2-9]{8}$/.test(__writes[0].path));
 reset();$('grpCode').value='https://invalid.test/?join=JOIN2345';$('grpJoin').click();await sleep();ok('joining asks explicit consent and adds only self',__confirm.some(s=>s.includes('加入群組'))&&__writes.length===1&&__writes[0].data.members.union==='qa-user');
 window.__reject='permission-denied';$('grpCode').value='FULL2345';$('grpJoin').click();await sleep();ok('membership denial provides 30-person/error feedback',$('grpMsg').textContent.includes('30 人'));window.__reject=null;
 reset();document.querySelector('[data-gleave="TEST2345"]').click();await sleep();ok('leaving asks consent and removes only self',__confirm.some(s=>s.includes('退出'))&&__writes[0]?.data.members.remove==='qa-user');
 await __auth(null);await sleep();ok('logout clears group feed UI',$('grpCard').hidden&&$('grpOn').hidden);
 return rows;
});checks.push({name:'no external calls',pass:external===0},{name:'no JavaScript errors',pass:errors.length===0});const result={checks,errors,external,scope:'real c-group.js with offline in-memory Firebase API; no backend rules emulator or real account'};fs.writeFileSync(path.join(out,'group-results.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));await browser.close();if(checks.some(c=>!c.pass))process.exitCode=1;})().catch(e=>{console.error(e);process.exitCode=1;});
