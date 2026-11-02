// Privacy tests execute the real c-group.js with an in-memory Firebase substitute.
// No user profile, real account, network message, clipboard or sharing API is used.
const fs=require('node:fs'),path=require('node:path');
const {evidenceUrl}=require('./test-config.cjs');
let pw;try{pw=require('playwright');}catch{pw=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));}
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-artifacts');fs.mkdirSync(out,{recursive:true});
const boot=String.raw`
window.__monday=()=>{const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-((d.getDay()+6)%7));return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
window.__writes=[];window.__queries=[];window.__toasts=[];window.__confirm=[];
window.PACE_FIREBASE={projectId:'synthetic-offline-test'};
window.confirm=s=>(__confirm.push(s),true);window.toast=s=>__toasts.push(s);window.burst=()=>{};window.burstAt=()=>{};window.showAlarm=s=>__toasts.push(s);
const group={id:'TEST2345',name:'測試群組',members:['qa-user','qa-friend'],names:{'qa-user':'測試者','qa-friend':'測試朋友'}};
const snapshot=rows=>({docs:rows.map(x=>({id:x.id,data:()=>x,metadata:{hasPendingWrites:false}})),docChanges:()=>[]});
const mockfs={
 collection:(_,...p)=>({path:p.join('/')}),doc:(_,...p)=>({path:p.join('/')}),where:(...x)=>({where:x}),orderBy:(...x)=>({orderBy:x}),limit:n=>({limit:n}),query:(ref,...filters)=>({...ref,filters}),
 onSnapshot:(q,next)=>{__queries.push(q);if(q.path==='groups')setTimeout(()=>next(snapshot([group])),0);
 else if(/\/plans\//.test(q.path))setTimeout(()=>next({exists:()=>false,data:()=>null,metadata:{}}),0);
 else if(/\/stats$/.test(q.path))setTimeout(()=>next(snapshot([{id:'qa-friend',uid:'qa-friend',name:'測試朋友',week:__monday(),rate:75,stars:3,glow:40,share:'some'}])),0);
 else if(/\/chat$/.test(q.path))setTimeout(()=>next(snapshot([{id:'qa-friend_1',uid:'qa-friend',name:'測試朋友',text:'<b>synthetic hi</b>',at:{toMillis:()=>Date.now()-60000}}])),0);
 else setTimeout(()=>next(snapshot([
 {id:'fresh',uid:'qa-friend',name:'測試朋友',title:'合成完成事項',minutes:35,at:{toMillis:()=>Date.now()-60000},cheers:{}},
 {id:'old',uid:'qa-friend',name:'測試朋友',title:'八天前的事項',minutes:20,at:{toMillis:()=>Date.now()-8*864e5},cheers:{}},
 {id:'mine',uid:'qa-user',name:'測試者',title:'自己完成的事項',minutes:25,at:{toMillis:()=>Date.now()-120000},cheers:{}}
 ])),0);return()=>{};},
 setDoc:async(ref,data)=>{__writes.push({kind:'set',path:ref.path,data});},
 updateDoc:async(ref,data)=>{if(window.__reject){const e=new Error('synthetic rejection');e.code=__reject;throw e;}__writes.push({kind:'update',path:ref.path,data});},
 deleteDoc:async ref=>{__writes.push({kind:'delete',path:ref.path});},
 getDocs:async q=>({docs:/\/(chat|feed)$/.test(q.path)?[{ref:{path:q.path+'/qa-user_mine'},data:()=>({uid:'qa-user'})}]:[]}),
 writeBatch:()=>{const refs=[];return{delete:r=>refs.push(r),commit:async()=>{refs.forEach(r=>__writes.push({kind:'delete',path:r.path}));}};},
 getDoc:async ref=>/\/plans\//.test(ref.path)?{exists:()=>false,data:()=>null}:{exists:()=>true,data:()=>({...group,members:['qa-friend']})},
 serverTimestamp:()=>({mockServerTime:true}),arrayUnion:v=>({union:v}),arrayRemove:v=>({remove:v}),deleteField:()=>({deleteField:true})
};
window.paceSync={onUser:fn=>{window.__auth=fn;setTimeout(()=>fn(null),0);},fb:()=>({fs:mockfs,db:{}})};
window.paceStore={paths:()=>[],read:()=>({d:null,t:0}),apply:()=>{},onWrite:fn=>{window.__localWrite=fn;return()=>{};}};
`;
fs.writeFileSync(path.join(out,'group-harness.html'),`<!doctype html><meta charset="utf-8"><body><section><div id="wishes"></div></section><dialog id="skinDlg"><h3 class="set-h">資料與隱私</h3></dialog><script>${boot}</script><script>${fs.readFileSync(path.join(root,'pace-build/c-group.js'),'utf8')}</script>`);
(async()=>{const browser=await pw.chromium.launch({headless:true});const context=await browser.newContext();let external=0;await context.route('**/*',r=>{if(new URL(r.request().url()).hostname==='127.0.0.1')return r.continue();external++;return r.abort();});const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.clock.install({time:new Date('2026-10-28T14:37:00+08:00')});await page.goto(evidenceUrl+'group-harness.html');
const checks=await page.evaluate(async()=>{
 const rows=[],ok=(name,pass)=>rows.push({name,pass:!!pass}),$=id=>document.getElementById(id),sleep=()=>new Promise(r=>setTimeout(r,50)),reset=()=>{__writes.length=0;};
 await sleep();ok('logged-out users cannot view group controls',$('grpOn').hidden&&!$('grpOff').hidden&&$('grpCard').hidden);$('grpNew').click();await sleep();ok('logged-out create is rejected with no writes',__writes.length===0&&$('grpMsg').textContent.includes('先登入'));
 await __auth({uid:'qa-user',displayName:'測試者'});await sleep();ok('signed-in group UI appears',!$('grpOn').hidden&&$('grpOff').hidden&&!$('grpCard').hidden);
 ok('feed shows only last seven days',$('grpFeed').textContent.includes('合成完成事項')&&!$('grpFeed').textContent.includes('八天前'));
 ok('own applause button disabled',document.querySelector('[data-cheer="TEST2345/mine"]').disabled);
 ok('queries never request private timelines',__queries.every(q=>q.path==='groups'||/^groups\/[^/]+\/(feed|stats|chat)$/.test(q.path)||/^groups\/[^/]+\/plans\/qa-user$/.test(q.path)));
 ok('legacy member is asked to decide before anything is shared',$('grpRooms').textContent.includes('現在決定'));
 reset();__localWrite('tasks/early',{title:'PRIVATE early',minutes:10,done:true});await sleep();ok('nothing is shared to a group I have not decided about',__writes.filter(w=>w.path.includes('/feed/')).length===0);
 document.querySelector('#grpRooms [data-groom="TEST2345"]').click();await sleep();$('grpMsgIn').value='hello';$('grpSend').click();await sleep();
 ok('undecided member must decide before chatting',$('grpConsent').open&&!__writes.some(w=>/\/chat\//.test(w.path)));
 $('gcNo').click();await sleep();ok('cancelling sends nothing',!__writes.some(w=>/\/chat\//.test(w.path))&&$('grpRoomMsg').textContent.includes('先決定'));
 $('grpRoomClose').click();await sleep();
 document.querySelector('#grpRooms [data-gprivacy]').click();await sleep();$('gcAge').click();$('gcYes').click();await sleep();await sleep();ok('deciding removes the notice',!$('grpRooms').textContent.includes('現在決定'));await new Promise(r=>setTimeout(r,4600));reset();
 const block=(id,done=true)=>({id,name:'PRIVATE synthetic task',day:2,start:'19:00',minutes:45,cat:'study',done,reflection:{text:'PRIVATE reflection'},apiKey:'SYNTHETIC_DO_NOT_LEAK'});
 reset();__localWrite('weeks/2026-10-26',{blocks:[block('normal')]});await sleep();const normal=__writes[0];ok('completed item writes only feed',normal?.kind==='set'&&normal.path==='groups/TEST2345/feed/qa-user_b-2026-10-26-normal');
 ok('completion payload only allowed public fields',Object.keys(normal?.data||{}).sort().join(',')==='at,cheers,expireAt,minutes,name,title,uid');
 ok('schedule/reflection/key never leave via group payload',!JSON.stringify(__writes).includes('reflection')&&!JSON.stringify(__writes).includes('19:00')&&!JSON.stringify(__writes).includes('SYNTHETIC_DO_NOT_LEAK'));
 $('grpHide').checked=true;$('grpHide').dispatchEvent(new Event('change'));reset();__localWrite('tasks/hidden',{title:'PRIVATE hidden task',minutes:30,done:true});await sleep();ok('minutes-only preference omits task title',__writes.length===1&&__writes[0].data.title===''&&__writes[0].data.minutes===30&&!JSON.stringify(__writes).includes('PRIVATE'));
 $('grpShare').checked=false;$('grpShare').dispatchEvent(new Event('change'));reset();__localWrite('tasks/optout',{title:'PRIVATE opted out',minutes:15,done:true});await sleep();ok('share opt-out writes no completion',__writes.length===0);
 reset();__localWrite('weeks/2026-10-26',{blocks:[block('normal',false)]});await sleep();ok('undo completion retracts activity even after opt-out',__writes.some(w=>w.kind==='delete'&&w.path.endsWith('b-2026-10-26-normal')));
 $('grpShare').checked=true;$('grpShare').dispatchEvent(new Event('change'));reset();paceStore.apply('tasks/remote',{title:'remote',minutes:20,done:true},1);__localWrite('tasks/remote',{title:'remote',minutes:20,done:true});await sleep();ok('remote synced completion is not rebroadcast',__writes.length===0);
 reset();__localWrite('tasks/tour',{title:'example',minutes:20,done:true,tour:true});__localWrite('weeks/buffer',{blocks:[{...block('buffer'),cat:'buffer'}]});await sleep();ok('tour and buffer items are not shared',__writes.length===0);
 reset();document.querySelector('[data-cheer="TEST2345/fresh"]').click();await sleep();ok('applause updates only own cheer',__writes.length===1&&Object.keys(__writes[0].data).join(',')==='cheers.qa-user');
 reset();$('grpName').value='合成新群組';$('grpNew').click();await sleep();ok('create asks consent before writing anything',$('grpConsent').open&&__writes.length===0&&$('gcTitle').textContent.includes('建立「合成新群組」前'));
 ok('consent defaults to private and lists always-visible data',document.querySelector('#grpConsent input[value="none"]').checked&&['名字','達成率','聊天室'].every(w=>$('grpConsent').textContent.includes(w)));
 $('gcAge').click();$('gcYes').click();await sleep();const gw=__writes.find(w=>w.kind==='set'&&/^groups\/[A-Z2-9]{8}$/.test(w.path));ok('new group has only self as member',gw&&gw.data.members.join(',')==='qa-user');
 const pw=__writes.find(w=>/\/plans\/qa-user$/.test(w.path));ok('private choice stores no plan blocks',pw&&pw.data.access==='none'&&pw.data.blocks.length===0&&pw.data.allow.length===0);
 reset();$('grpCode').value='JOIN2345';$('grpJoin').click();await sleep();ok('join shows consent first',$('grpConsent').open&&$('gcTitle').textContent.includes('加入「測試群組」前')&&__writes.length===0);
 $('gcNo').click();await sleep();ok('declining consent joins nothing',__writes.length===0&&!$('grpConsent').open);
 reset();$('grpCode').value='https://invalid.test/?join=JOIN2345';$('grpJoin').click();await sleep();document.querySelector('#grpConsent input[value="some"]').click();document.querySelector('#gcPick input').click();$('gcAge').click();$('gcYes').click();await sleep();
 ok('joining adds only self',__writes.filter(w=>w.kind==='update').length===1&&__writes.find(w=>w.kind==='update').data.members.union==='qa-user');
 const jp=__writes.find(w=>/JOIN2345\/plans\/qa-user$/.test(w.path));ok('"only ticked" stores the ticked uid',jp&&jp.data.access==='some'&&jp.data.allow.join(',')==='qa-friend');
 window.__reject='permission-denied';$('grpCode').value='FULL2345';$('grpJoin').click();await sleep();await sleep();$('gcAge').click();$('gcYes').click();await sleep();await sleep();await sleep();ok('membership denial provides 30-person/error feedback',$('grpMsg').textContent.includes('30 人'));window.__reject=null;
 document.querySelector('#grpRooms [data-groom="TEST2345"]').click();await sleep();ok('room opens with every member listed',$('grpRoom').open&&['測試者','測試朋友'].every(n=>$('grpMembers').textContent.includes(n)));
 ok('member numbers are shown',$('grpMembers').textContent.includes('達成率 75%')&&$('grpMembers').textContent.includes('3'));
 ok('chat text is escaped',$('grpChat').textContent.includes('<b>synthetic hi</b>')&&!$('grpChat').querySelector('b'));
 ok('plan button for a member who shares',!!document.querySelector('#grpMembers [data-plan="qa-friend"]'));
 reset();$('grpMsgIn').value='hello';$('grpSend').click();await sleep();const cw=__writes.find(w=>/\/chat\//.test(w.path));
 ok('decided member can chat, signed with the name the group has for them',cw&&cw.data.text==='hello'&&cw.data.name==='測試者'&&cw.data.uid==='qa-user');
 $('grpRoomClose').click();await sleep();ok('closing the room stops its listeners',!$('grpRoom').open);
 reset();document.querySelector('[data-gleave="TEST2345"]').click();await sleep();ok('leaving asks consent and removes only self',__confirm.some(s=>s.includes('退出'))&&__writes.find(w=>w.kind==='update')?.data.members.remove==='qa-user');
 ok('leaving also deletes my chat and 搞定 posts',['chat','feed'].every(c=>__writes.some(w=>w.kind==='delete'&&w.path==='groups/TEST2345/'+c+'/qa-user_mine')));
 ok('leaving deletes my plan and numbers',['plans','stats'].every(c=>__writes.some(w=>w.kind==='delete'&&w.path==='groups/TEST2345/'+c+'/qa-user')));
 await __auth(null);await sleep();ok('logout clears group feed UI',$('grpCard').hidden&&$('grpOn').hidden);
 return rows;
});checks.push({name:'no external calls',pass:external===0},{name:'no JavaScript errors',pass:errors.length===0});const result={checks,errors,external,scope:'real c-group.js with offline in-memory Firebase API; no backend rules emulator or real account'};fs.writeFileSync(path.join(out,'group-results.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));await browser.close();if(checks.some(c=>!c.pass))process.exitCode=1;})().catch(e=>{console.error(e);process.exitCode=1;});
