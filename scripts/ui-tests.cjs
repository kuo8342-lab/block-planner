// All tests run in disposable browser contexts with synthetic records.
// Non-loopback requests are blocked; no real cloud, AI, credentials or browser profile is used.
const fs = require('node:fs');
const path = require('node:path');
const { previewUrl, evidenceUrl } = require('./test-config.cjs');
let playwright;
try { playwright = require('playwright'); } catch {
  playwright = require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
}
const root = path.resolve(__dirname,'..');
const out = path.join(root,'test-artifacts');
const phase = process.argv.includes('--baseline') ? 'before' : 'after';
const widths = [375,390,430,440,768,1024,1280,1440];
const base = phase === 'before' ? evidenceUrl + 'baseline/' : previewUrl;
// Entirely synthetic presentation data, shared unchanged by before/after captures.
// It does not reuse any exported personal schedule or connected browser storage.
const seed={
 'config/main':{
  modules:[['數學練習','study',50],['閱讀筆記','study',40],['英文單字','lang',30],['程式練習','code',60],['預習明天','preview',25],['休息','rest',30],['運動','swim',45],['緩衝時間','buffer',30]].map(([name,cat,minutes],i)=>({id:'demo-'+i,name,cat,minutes})),
  fixed:[{id:'demo-reading',day:0,start:'08:00',end:'09:00',name:'閱讀時段',cat:'life'},{id:'demo-lunch',day:1,start:'12:00',end:'13:00',name:'午休',cat:'rest'},{id:'demo-sport',day:4,start:'15:00',end:'16:00',name:'運動',cat:'swim'}],
  special:[],holidays:[],targets:{數學:120,英文:90,程式:120},restMin:30,defaultTemplate:'',theme:'light',skin:'default'
 },
 'weeks/2026-10-26':{blocks:[
  {id:'demo1',name:'數學練習',cat:'study',day:0,start:'09:30',minutes:50,done:true},
  {id:'demo2',name:'英文單字',cat:'lang',day:1,start:'09:00',minutes:30,done:true},
  {id:'demo3',name:'閱讀筆記',cat:'study',day:1,start:'10:00',minutes:40,done:false},
  {id:'demo4',name:'休息',cat:'rest',day:0,start:'10:30',minutes:30,done:false},
  {id:'demo5',name:'程式練習',cat:'code',day:2,start:'10:00',minutes:60,done:false},
  {id:'demo6',name:'預習明天',cat:'preview',day:3,start:'09:30',minutes:45,done:false},
  {id:'demo7',name:'數學練習',cat:'study',day:4,start:'11:00',minutes:50,done:false},
  {id:'demo8',name:'閱讀筆記',cat:'study',day:5,start:'09:00',minutes:60,done:false},
  {id:'demo9',name:'休息',cat:'rest',day:6,start:'10:00',minutes:45,done:false}
 ]},
 'tasks/demo-task':{title:'整理本週閱讀清單',minutes:20,cat:'study',showFrom:'2026-10-26',due:'2026-10-30',done:false,goalId:'demo-goal'},
 'goals/demo-goal':{title:'建立穩定的讀書節奏',due:'2026-11-08',createdAt:'2026-10-26T00:00:00Z',totalDays:13},
 'wishes/demo-wish':{title:'讀完一本喜歡的書',minutes:90,createdAt:'2026-10-26T00:00:00Z'}
};
const results={phase,base,viewports:[],harness:[],errors:[],blockedExternal:[]};
async function context(browser,width,withSeed=true){
  const c=await browser.newContext({viewport:{width,height:width<768?844:1000},deviceScaleFactor:1,timezoneId:'Asia/Taipei',locale:'zh-TW',colorScheme:'light',serviceWorkers:'block',hasTouch:width<768,isMobile:width<768});
  await c.route('**/*', route=>{const u=new URL(route.request().url());if(['127.0.0.1','localhost'].includes(u.hostname)||['data:','blob:'].includes(u.protocol)) return route.continue(); results.blockedExternal.push(u.origin);return route.abort();});
  await c.addInitScript(({seed,withSeed})=>{localStorage.setItem('pace-lang','zh');localStorage.setItem('pace-persona','custom');localStorage.setItem('pace-tour-done','1');localStorage.setItem('pace-seen-version','2026-10-28b');if(withSeed&&!sessionStorage.getItem('qa-seeded')){localStorage.setItem('pace-db-v1',JSON.stringify(seed));sessionStorage.setItem('qa-seeded','1');}window.__qaErrors=[];addEventListener('error',e=>window.__qaErrors.push(e.message));}, {seed,withSeed});
  return c;
}
(async()=>{
  fs.mkdirSync(out,{recursive:true});
  const browser=await playwright.chromium.launch({headless:true});
  for(const width of (process.argv.includes('--harness-only')?[]:widths)){
    const c=await context(browser,width);const p=await c.newPage();
    // Start from a stable time with the clock advancing normally. Reminders and
    // elapsed-time drag guards stay active without live-clock startup alarms.
    await p.clock.install({time:new Date('2026-10-28T14:37:00+08:00')});
    p.on('pageerror',e=>results.errors.push(`${width}: ${e.message}`));
    await p.goto(base,{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>typeof state!=='undefined'&&state.ready&&state.config);
    await p.evaluate(()=>{state.monday=new Date(2026,9,26);subscribeWeek();});await p.waitForTimeout(650);
    await p.evaluate(()=>document.getElementById('gridScroll').scrollTop=0);
    await p.screenshot({path:path.join(out,`${phase}-${width}.png`),fullPage:true,animations:'disabled'});
    if([390,1440].includes(width)) await p.screenshot({path:path.join(out,`${phase}-${width}-viewport.png`),animations:'disabled'});
    const geometry=await p.evaluate(()=>({viewport:innerWidth,viewportHeight:innerHeight,document:document.documentElement.scrollWidth,documentHeight:document.documentElement.scrollHeight,body:document.body.scrollWidth,columns:document.querySelectorAll('.col').length,modules:document.querySelectorAll('#palette [data-drag^="module:"]').length,background:getComputedStyle(document.body).backgroundColor,visibleDialogs:[...document.querySelectorAll('dialog[open]')].map(d=>d.id)}));
    results.viewports.push({width,...geometry});console.log(`${phase} screenshot ${width}px; document width ${geometry.document}`);
    await c.close();
  }
  if(!process.argv.includes('--screenshots-only')){
    const c=await context(browser,1440,false); const p=await c.newPage();
    await p.clock.install({time:new Date('2026-10-28T14:37:00+08:00')});
    await p.goto(`${evidenceUrl}${phase==='before'?'baseline':'redesign'}-harness.html`,{waitUntil:'domcontentloaded'});
    await p.waitForFunction(()=>typeof runTests==='function'&&typeof state!=='undefined'&&state.ready&&state.config);
    results.harness=await p.evaluate(()=>runTests());
    console.log(`Legacy harness: ${results.harness.filter(s=>s.startsWith('PASS')).length} passed, ${results.harness.filter(s=>/^(FAIL|CRASH)/.test(s)).length} failed`);
    console.log(results.harness.filter(s=>/^(FAIL|CRASH)/.test(s)).join('\n'));
    await c.close();
  }
  await browser.close();results.blockedExternal=[...new Set(results.blockedExternal)];
  const resultPath=path.join(out,`${phase}-results.json`);
  if(process.argv.includes('--screenshots-only')&&fs.existsSync(resultPath))results.harness=JSON.parse(fs.readFileSync(resultPath,'utf8')).harness||[];
  fs.writeFileSync(resultPath,JSON.stringify(results,null,2));
  if(results.errors.length||results.harness.some(s=>/^(FAIL|CRASH)/.test(s))||results.viewports.some(v=>v.document>v.width+1||(phase==='after'&&v.width<768&&v.documentHeight>v.viewportHeight+2)))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
