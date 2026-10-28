// Integration checks against the generated C app. Uses fresh, disposable storage only.
const fs=require('node:fs'),path=require('node:path');
const {previewUrl}=require('./test-config.cjs');
let pw;try{pw=require('playwright');}catch{pw=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));}
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-artifacts');
const results={checks:[],dialogs:[],errors:[],blockedExternal:[]};
let browser;
const ok=(name,pass,info)=>{results.checks.push({name,pass:!!pass,...(info?{info}:{} )});console.log(`${pass?'PASS':'FAIL'} ${name}${info?' '+info:''}`);};
(async()=>{
  browser=await pw.chromium.launch({headless:true});
  for(const width of [1440,390]){
    const context=await browser.newContext({viewport:{width,height:width<768?844:1000},timezoneId:'Asia/Taipei',locale:'zh-TW',colorScheme:'dark',serviceWorkers:'block',hasTouch:width<768,isMobile:width<768});
    await context.addInitScript(()=>{localStorage.setItem('pace-lang','zh');localStorage.setItem('pace-persona','custom');localStorage.setItem('pace-tour-done','1');localStorage.setItem('pace-seen-version','2026-10-28b');});
    await context.route('**/*',r=>{const url=new URL(r.request().url());if(url.hostname==='127.0.0.1')return r.continue();results.blockedExternal.push(url.origin);return r.abort();});
    const page=await context.newPage();page.on('pageerror',e=>results.errors.push(`${width}: ${e.message}`));
    // Stable initial time, unpaused: retain reminder logic and real elapsed deltas.
    await page.clock.install({time:new Date('2026-10-28T14:37:00+08:00')});
    await page.goto(previewUrl,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>typeof state!=='undefined'&&state.ready&&state.config);
    await page.waitForTimeout(650);
    const checks=await page.evaluate(async()=>{
      const results=[],ok=(name,pass)=>results.push({name,pass:!!pass}),$=id=>document.getElementById(id),sleep=ms=>new Promise(r=>setTimeout(r,ms));
      ok('boot default modules retained',state.config.modules.length===4);
      ok('OS dark preference still uses light UI',getComputedStyle(document.body).backgroundColor==='rgb(255, 255, 255)');
      $('newModule').click();$('mName').value='QA 自訂方塊';$('mMin').value='35';$('mSave').click();await sleep(80);
      const module=state.config.modules.find(m=>m.name==='QA 自訂方塊');ok('create module',module&&module.minutes===35);
      openModule(module.id);$('mDay').value='6';$('mStart').value='10:00';$('mPut').click();await sleep(80);
      let b=state.week.blocks.find(b=>b.name==='QA 自訂方塊');ok('schedule module without drag',b?.day===6&&b.start==='10:00');
      openBlock(b.id);$('dName').value='QA 修改名稱';$('dMin').value='45';$('dlgForm').requestSubmit();await sleep(80);
      b=state.week.blocks.find(x=>x.id===b.id);ok('edit block duration and title',b.name==='QA 修改名稱'&&b.minutes===45);
      toggleDone(b.id);ok('mark complete',state.week.blocks.find(x=>x.id===b.id).done);toggleDone(b.id);
      openBlock(b.id);$('dDup').click();await sleep(80);ok('duplicate block',state.week.blocks.filter(x=>x.name==='QA 修改名稱').length===2);
      if($('dlg').open)$('dlg').close();
      $('newGoalBtn').click();$('goalTitle').value='QA 本週目標';$('goalSteps').value='週1｜讀書 30分\n週1｜複習 20分';$('goalForm').requestSubmit();await sleep(80);
      const g=state.goals.find(g=>g.title==='QA 本週目標');ok('goal and scheduled steps',g&&state.tasks.filter(t=>t.goalId===g.id).length===2);
      $('qa').value='週日 15:00 數學 30分';$('quickAdd').requestSubmit();await sleep(80);ok('natural language quick add',state.week.blocks.some(b=>b.day===6&&b.start==='15:00'&&b.minutes===30));
      $('tTitle').value='QA 重複任務';$('tMin').value='25';$('tRepeat').checked=true;$('taskForm').requestSubmit();await sleep(80);const task=state.tasks.find(t=>t.title==='QA 重複任務');ok('recurring task create',task?.repeat==='weekly');
      $('wishInput').value='QA 看書 40分';$('wishForm').requestSubmit();await sleep(80);ok('wishlist create',state.wishes.some(w=>w.title==='QA 看書'&&w.minutes===40));
      const w=state.wishes.find(w=>w.title==='QA 看書');document.querySelector(`[data-wdel="${w.id}"]`).click();await sleep(50);$('toastUndo').click();await sleep(80);ok('undo preserves wishlist record',state.wishes.some(x=>x.id===w.id));
      $('tplBtn').click();$('tplName').value='QA 範本';$('tplForm').requestSubmit();await sleep(80);ok('template create',state.templates.some(t=>t.name==='QA 範本'));if($('tplDlg').open)$('tplDlg').close();
      $('toReport').click();await sleep(100);ok('weekly report',document.body.classList.contains('r')&&$('rKpis').children.length>0);
      document.querySelector('[data-rmode="day"]').click();await sleep(100);ok('daily report',!$('rListCard').hidden);
      document.querySelector('[data-rmode="month"]').click();await sleep(100);ok('monthly report',$('rBreak').children.length>0);$('backToGrid').click();
      $('toWidget').click();ok('sticky note opens',document.body.classList.contains('w'));$('toPlanner').click();ok('sticky note returns',!document.body.classList.contains('w'));
      $('skinBtn').click();ok('settings retains AI sync and backup',!!$('aiProvider')&&!!$('syncIn')&&!!$('exportAll')&&$('skinDlg').open);$('skinClose').click();
      document.activeElement?.blur();const before=ymd(state.monday);document.body.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));await sleep(80);ok('next-week keyboard shortcut',ymd(state.monday)!==before);
      document.body.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowLeft',bubbles:true}));await sleep(80);ok('previous-week keyboard shortcut',ymd(state.monday)===before);
      document.body.dispatchEvent(new KeyboardEvent('keydown',{key:'n',bubbles:true}));ok('N shortcut focuses quick add',document.activeElement===$('qa'));$('qa').blur();
      document.body.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
      await writeChain;await sleep(120);
      const saved=JSON.parse(localStorage.getItem('pace-db-v1'));ok('localStorage schema remains pace-db-v1',!!saved['config/main']&&Object.keys(saved).some(k=>k.startsWith('weeks/')));
      return results;
    });
    checks.forEach(x=>ok(`${width}: ${x.name}`,x.pass));
    await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>state.ready&&state.config&&state.goals);
    await page.waitForTimeout(250);
    ok(`${width}: persisted module/task/goal survive reload`,await page.evaluate(()=>state.config.modules.some(m=>m.name==='QA 自訂方塊')&&state.tasks.some(t=>t.title==='QA 重複任務')&&state.goals.some(g=>g.title==='QA 本週目標')));
    if(width===390){
      const nav=page.locator('.mobile-nav button');ok('390: five primary mobile views',await nav.count()===5);
      for(const [i,name] of ['calendar','tasks','blocks','focus','more'].entries()){
        await nav.nth(i).click();await page.waitForTimeout(250);
        const bounds=await page.evaluate(()=>({width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,w:innerWidth,h:innerHeight}));
        ok(`390: ${name} uses bounded viewport with internal scrolling`,bounds.width<=bounds.w+1&&bounds.height<=bounds.h+2,JSON.stringify(bounds));
        await page.screenshot({path:path.join(out,`after-390-${name}.png`)});
      }
      await nav.nth(0).click();
      const initial=await page.evaluate(()=>({visible:[...document.querySelectorAll('.col')].filter(x=>getComputedStyle(x).display!=='none'&&x.getBoundingClientRect().width>0).length,overflow:document.documentElement.scrollWidth>innerWidth}));
      ok('390: mobile opens in single-day view',initial.visible===1&&!initial.overflow,JSON.stringify(initial));
      const gridBounds=await page.evaluate(()=>({grid:document.getElementById('gridScroll').getBoundingClientRect().bottom,nav:document.querySelector('.mobile-nav').getBoundingClientRect().top}));
      ok('390: calendar scroll area ends above bottom navigation',gridBounds.grid<=gridBounds.nav+1,JSON.stringify(gridBounds));
      await page.locator('#pacePageActions .pace-add').click();ok('390: calendar Add opens original slot picker',await page.locator('#pickDlg').isVisible());await page.keyboard.press('Escape');
      await page.locator('[data-pace-day="1"]').focus();await page.keyboard.press('Enter');ok('390: date change preserves keyboard focus',await page.evaluate(()=>document.activeElement?.dataset.paceDay==='1'));
      await nav.nth(1).click();await page.locator('#qa').fill('尚未送出的手機草稿');
      await page.evaluate(()=>window.__qaNode=document.getElementById('qa'));
      await nav.nth(2).click();await nav.nth(4).click();await nav.nth(1).click();
      ok('390: switching views preserves input and same DOM node',await page.evaluate(()=>document.getElementById('qa')===window.__qaNode&&document.getElementById('qa').value==='尚未送出的手機草稿'));
      await page.setViewportSize({width:1440,height:1000});await page.waitForTimeout(250);await page.setViewportSize({width:390,height:844});await page.waitForTimeout(250);
      ok('390: phone-desktop-phone resize preserves draft and DOM node',await page.evaluate(()=>document.getElementById('qa')===window.__qaNode&&document.getElementById('qa').value==='尚未送出的手機草稿'));
      const allTasks=await page.locator('#tasks .task:not(.pace-filtered)').count();await page.locator('[data-task-filter="today"]').click();const todayTasks=await page.locator('#tasks .task:not(.pace-filtered)').count();
      ok('390: today filter is a subset without deleting tasks',todayTasks<=allTasks&&await page.locator('#tasks .task').count()===allTasks);await page.locator('[data-task-filter="week"]').click();ok('390: weekly filter restores task list',await page.locator('#tasks .task:not(.pace-filtered)').count()===allTasks);
      await page.screenshot({path:path.join(out,'after-390-tasks.png')});
      await page.setViewportSize({width:390,height:460});await page.locator('#qa').focus();await page.waitForTimeout(250);
      const keyboard=await page.evaluate(()=>{const q=document.getElementById('qa').getBoundingClientRect();return {document:document.documentElement.scrollWidth,viewport:innerWidth,visible:q.height>0&&q.bottom>0&&q.top<innerHeight,visualHeight:parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--pace-visual-height'))};});
      ok('390: shrunk virtual-keyboard viewport retains reachable input',keyboard.document===keyboard.viewport&&keyboard.visible&&keyboard.visualHeight<=460,JSON.stringify(keyboard));
      await page.setViewportSize({width:390,height:844});await page.locator('#qa').fill('');
      await nav.nth(2).click();await page.locator('#newModule').click();ok('390: blocks view opens native editor',await page.locator('#modDlg').isVisible());await page.keyboard.press('Escape');
      await page.locator('[data-block-filter="2"]').click();ok('390: block category filters retain correct semantic categories',await page.evaluate(()=>[...document.querySelectorAll('#palette [data-drag]')].filter(el=>el.getBoundingClientRect().width>0).every(el=>GROUPS[2][1].includes(state.config.modules.find(m=>'module:'+m.id===el.dataset.drag)?.cat))));await page.locator('[data-block-filter="-1"]').click();
      await nav.nth(0).click();await page.evaluate(()=>paceUI.setCalendarMode('week'));await page.waitForTimeout(200);
      ok('390: weekly view retains seven day columns',await page.evaluate(()=>[...document.querySelectorAll('.col')].filter(x=>getComputedStyle(x).display!=='none'&&x.getBoundingClientRect().width>0).length===7));
      await page.evaluate(()=>{paceUI.setCalendarMode('day');paceUI.setDay(1);});await page.waitForTimeout(100);
      ok('390: date picker switches visible day',await page.evaluate(()=>{const visible=[...document.querySelectorAll('.col')].filter(x=>getComputedStyle(x).display!=='none'&&x.getBoundingClientRect().width>0);return visible.length===1&&visible[0].dataset.day==='1';}));
      await page.screenshot({path:path.join(out,'after-390-day.png')});
    }else{
      await page.locator('.rail-close').click();ok('1440: desktop rail collapses',await page.evaluate(()=>document.body.classList.contains('rail-collapsed')));
      await page.locator('.workspace-toggle').click();ok('1440: desktop rail restores',await page.evaluate(()=>!document.body.classList.contains('rail-collapsed')));
    }
    // Drag and resize through the real shell, preserving the original 1 px/min math.
    if(width===390)await page.locator('.mobile-nav button').nth(2).click();
    const chip=page.locator('[data-drag="module:m0"]');await chip.scrollIntoViewIfNeeded();const rect=await chip.boundingBox();
    if(width===1440){await page.mouse.move(rect.x+20,rect.y+12);await page.mouse.down();await page.mouse.move(rect.x+35,rect.y+20);}
    else{await chip.dispatchEvent('pointerdown',{bubbles:true,cancelable:true,clientX:rect.x+20,clientY:rect.y+12,button:0,pointerId:8,isPrimary:true,pointerType:'touch'});await page.waitForTimeout(380);await page.evaluate(({x,y})=>document.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,cancelable:true,clientX:x+35,clientY:y+25,button:0,pointerId:8,isPrimary:true,pointerType:'touch'})),rect);await page.waitForTimeout(250);}
    await page.evaluate(()=>{document.getElementById('gridScroll').scrollTop=560;});await page.waitForTimeout(100);
    const target=await page.evaluate(()=>{const r=document.querySelector('.col[data-day="1"]').getBoundingClientRect();return {x:r.left+Math.min(40,r.width/2),y:r.top+OFF+(19*60-START)};});
    if(width===1440){await page.mouse.move(target.x,target.y,{steps:10});await page.mouse.up();}
    else await page.evaluate(({x,y})=>{document.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,cancelable:true,clientX:x,clientY:y,button:0,pointerId:8,isPrimary:true,pointerType:'touch'}));(document.elementFromPoint(x,y)||document).dispatchEvent(new PointerEvent('pointerup',{bubbles:true,cancelable:true,clientX:x,clientY:y,button:0,pointerId:8,isPrimary:true,pointerType:'touch'}));},target);
    await page.waitForTimeout(150);ok(`${width}: real ${width===1440?'mouse':'touch'} module drag`,await page.evaluate(()=>state.week.blocks.some(b=>b.name==='讀書'&&b.day===1&&Math.abs(toMin(b.start)-19*60)<=5)),JSON.stringify(target));
    const resize=await page.evaluate(async()=>{const b=state.week.blocks.find(b=>b.name==='讀書'&&b.day===1);if(!b)return null;const el=document.querySelector(`[data-bid="${b.id}"]`),handle=el.querySelector('.rz');if(!handle)return {missing:true};const r=handle.getBoundingClientRect(),old=b.minutes;const p=(type,x,y,target)=>target.dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,clientX:x,clientY:y,button:0,pointerId:9,isPrimary:true,pointerType:'touch'}));p('pointerdown',r.left+6,r.top+2,handle);await new Promise(r=>setTimeout(r,380));p('pointermove',r.left+6,r.top+32,document);p('pointerup',r.left+6,r.top+32,document);return {old,now:state.week.blocks.find(x=>x.id===b.id)?.minutes};});
    ok(`${width}: resize preserves original minute geometry`,resize&&resize.now>resize.old,JSON.stringify(resize));
    await page.evaluate(()=>{document.activeElement?.blur();document.body.dispatchEvent(new KeyboardEvent('keydown',{key:'n',bubbles:true}));});ok(`${width}: N reveals quick-entry view`,await page.locator('#qa').isVisible());
    await page.evaluate(()=>document.getElementById('qa').blur());
    await page.evaluate(()=>{if(innerWidth<768)paceUI.showView('focus');const b=state.week.blocks.find(b=>b.name==='QA 修改名稱');startFocus(b);if(innerWidth>=768)setWidget(true);});
    if(width===390){
      await page.locator('[data-pace-nav="more"]').click();await page.locator('#toWidget').click();
      ok('390: trusted sticky-note click preserves active timer',await page.evaluate(()=>document.body.classList.contains('w'))&&await page.locator('#fPause').isVisible());
      await page.keyboard.press('n');await page.locator('[data-pace-nav="focus"]').click();
      ok('390: widget to N to Focus reattaches live timer',await page.evaluate(()=>document.getElementById('wFocus').parentElement.id==='paceFocusPanel')&&await page.locator('#fPause').isVisible());
      await page.keyboard.press('w');ok('390: trusted W opens active-focus widget',await page.evaluate(()=>document.body.classList.contains('w'))&&await page.locator('#fPause').isVisible());
      await page.keyboard.press('w');ok('390: W returns active timer to focus page',await page.evaluate(()=>!document.body.classList.contains('w')&&document.getElementById('wFocus').parentElement.id==='paceFocusPanel')&&await page.locator('#fPause').isVisible());
    }
    await page.waitForTimeout(100);ok(`${width}: focus pause control exists`,await page.locator('#fPause').isVisible());await page.locator('#fPause').click();const pausedTime=await page.locator('#fTime').innerText();await page.clock.fastForward(65000);await page.waitForTimeout(50);
    ok(`${width}: paused countdown does not elapse`,await page.locator('#fTime').innerText()===pausedTime);
    await page.locator('#fPause').click();await page.clock.fastForward(2000);await page.waitForTimeout(50);ok(`${width}: countdown continues after resume`,await page.locator('#fTime').innerText()!==pausedTime);
    await page.locator('#fPause').click();await page.clock.fastForward(65000);await page.locator('#fStop').click();await page.waitForTimeout(80);ok(`${width}: stop while paused clears focus without counting pause`,await page.evaluate(()=>!focus&&!localStorage.getItem('pace-ui-focus-pause-v1')&&(state.week.blocks.find(b=>b.name==='QA 修改名稱').actual||0)<=1));
    await page.evaluate(()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());setWidget(false);if(innerWidth<768)paceUI.showView('calendar');});
    const pressButton=page.locator(width<768?'#paceToday':'#thisW');const pressRect=await pressButton.boundingBox();
    await page.mouse.move(pressRect.x+10,pressRect.y+10);await page.mouse.down();
    ok(`${width}: pointer press has immediate visual state`,await pressButton.evaluate(el=>el.classList.contains('pace-pressed')));await page.mouse.up();await page.waitForTimeout(200);
    ok(`${width}: release clears pressed state`,await pressButton.evaluate(el=>!el.classList.contains('pace-pressed')));
    // Native dialogs are measured individually after opening; overflow belongs
    // to their scrollable interior, never to the page or inaccessible close action.
    for(const id of ['goalDlg','modDlg','dlg','skinDlg','tplDlg','newFixDlg','dayOffDlg']){
      await page.evaluate(id=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const d=document.getElementById(id);d.showModal();},id);
      await page.waitForTimeout(300);
      const geometry=await page.evaluate(id=>{const d=document.getElementById(id),r=d.getBoundingClientRect();return {id,width:innerWidth,left:r.left,right:r.right,top:r.top,bottom:r.bottom,viewportHeight:innerHeight,internalOverflow:d.scrollWidth>d.clientWidth+1};},id);
      results.dialogs.push(geometry);ok(`${width}: ${id} fits viewport`,geometry.left>=-1&&geometry.right<=width+1&&geometry.top>=-1&&geometry.bottom<=geometry.viewportHeight+1&&!geometry.internalOverflow,JSON.stringify(geometry));
      if(['goalDlg','skinDlg','dlg'].includes(id))await page.screenshot({path:path.join(out,`after-${width}-${id}.png`)});
      await page.keyboard.press('Escape');
    }
    await context.close();
  }
  const oldStore={
    'config/main':{modules:[{id:'legacy-module',name:'既有測試方塊',cat:'study',minutes:40}],fixed:[],special:[],targets:{數學:80},holidays:[],defaultTemplate:'',skin:'default',customPreservedField:'synthetic legacy value'},
    'weeks/2026-10-26':{blocks:[{id:'legacy-block',day:2,start:'09:00',minutes:40,name:'既有測試方塊',cat:'study',done:true,reflection:{text:'測試心得',done:true}}],skipFixed:['legacy-fixed']},
    'tasks/legacy-task':{title:'既有測試任務',minutes:25,cat:'study',done:false,showFrom:'2026-10-26',repeat:'weekly'},
    'goals/legacy-goal':{title:'既有測試目標',due:'2026-11-01'},
    'templates/legacy-template':{name:'既有測試範本',blocks:[]},
    'notes/legacy-note':{text:'既有測試備註'},
    'closures/legacy-closure':{date:'2026-10-30',name:'測試休假'},
    'custom/unknown-record':{value:'must remain intact'}
  };
  const migration=await browser.newContext({serviceWorkers:'block'});
  await migration.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
  await migration.addInitScript(store=>{localStorage.setItem('pace-db-v1',JSON.stringify(store));localStorage.setItem('pace-db-meta','{"weeks/2026-10-26":12345}');localStorage.setItem('pace-lang','zh');localStorage.setItem('pace-persona','custom');localStorage.setItem('pace-tour-done','1');localStorage.setItem('pace-seen-version','2026-10-28b');localStorage.setItem('pace-api-key','sk-ant-SYNTHETIC_QA_SECRET_DO_NOT_LEAK_123456');},oldStore);
  const oldPage=await migration.newPage();oldPage.on('pageerror',e=>results.errors.push(`legacy-data: ${e.message}`));
  await oldPage.clock.install({time:new Date('2026-10-28T14:37:00+08:00')});
  await oldPage.goto(previewUrl,{waitUntil:'domcontentloaded'});await oldPage.waitForFunction(()=>state.ready&&state.config);await oldPage.waitForTimeout(650);
  ok('existing synthetic records remain byte-for-byte unchanged on boot',await oldPage.evaluate(expected=>localStorage.getItem('pace-db-v1')===JSON.stringify(expected),oldStore));
  ok('existing sync metadata remains unchanged on boot',await oldPage.evaluate(()=>localStorage.getItem('pace-db-meta')==='{"weeks/2026-10-26":12345}'));
  await oldPage.locator('#skinBtn').click();
  ok('saved API key is not exposed as readable form value',await oldPage.evaluate(()=>!document.documentElement.outerHTML.includes('SYNTHETIC_QA_SECRET_DO_NOT_LEAK_123456')&&document.getElementById('aiKey').value===''));
  const backupEvent=oldPage.waitForEvent('download');await oldPage.locator('#exportAll').click();const backup=await backupEvent;const backupPath=path.join(out,'synthetic-backup.json');await backup.saveAs(backupPath);
  const backupData=fs.readFileSync(backupPath,'utf8');ok('backup excludes saved API key',!backupData.includes('SYNTHETIC_QA_SECRET_DO_NOT_LEAK_123456'));
  await migration.close();
  const reduced=await browser.newContext({reducedMotion:'reduce',viewport:{width:390,height:844},serviceWorkers:'block'});
  await reduced.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
  await reduced.addInitScript(()=>{localStorage.setItem('pace-lang','zh');localStorage.setItem('pace-persona','custom');localStorage.setItem('pace-tour-done','1');localStorage.setItem('pace-seen-version','2026-10-28b');});
  const reducedPage=await reduced.newPage();await reducedPage.clock.install({time:new Date('2026-10-28T14:37:00+08:00')});await reducedPage.goto(previewUrl+'#widget');await reducedPage.waitForFunction(()=>state.ready&&state.config);
  ok('initial #widget URL preserves compact widget mode',await reducedPage.evaluate(()=>document.body.classList.contains('w')&&getComputedStyle(document.getElementById('widget')).display!=='none'));
  await reducedPage.evaluate(()=>{state.tasks=Array.from({length:18},(_,i)=>({id:'widget-test-'+i,title:'合成任務 '+i,minutes:20,cat:'study',done:false,showFrom:ymd(state.monday)}));renderWidget();});
  ok('18-task widget keeps page bounded and list scrollable',await reducedPage.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+2&&document.getElementById('wTasks').scrollHeight>document.getElementById('wTasks').clientHeight));
  await reducedPage.locator('#toPlanner').click();
  ok('reduced motion disables decorative effects',await reducedPage.evaluate(()=>document.getElementById('fxToggle').disabled));
  const reducedButton=reducedPage.locator('#paceToday'),rr=await reducedButton.boundingBox();await reducedPage.mouse.move(rr.x+10,rr.y+10);await reducedPage.mouse.down();
  ok('reduced motion removes press scale and transitions',await reducedButton.evaluate(el=>{const s=getComputedStyle(el);return (s.scale==='1'||s.scale==='none')&&s.transitionDuration.split(',').every(v=>parseFloat(v)===0);}));await reducedPage.mouse.up();await reduced.close();
  results.blockedExternal=[...new Set(results.blockedExternal)];ok('no uncaught JavaScript errors',results.errors.length===0,results.errors.join(';'));
  fs.writeFileSync(path.join(out,'app-results.json'),JSON.stringify(results,null,2));
  await browser.close();if(results.checks.some(x=>!x.pass))process.exitCode=1;
})().catch(async e=>{console.error(e);fs.writeFileSync(path.join(out,'app-results.json'),JSON.stringify({...results,crash:String(e.stack)},null,2));await browser?.close();process.exitCode=1;});
