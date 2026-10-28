/* C-only navigation: keep one copy of every original form, handler and data node. */
(() => {
  const $=id=>document.getElementById(id), mobile=matchMedia('(max-width:767px)');
  const tr=(zh,en)=>window.paceLang?.()==='en'?en:zh;
  const icon=name=>({calendar:'▦',tasks:'☑',blocks:'▥',focus:'◷',more:'•••',goals:'◎',wishes:'☆',groups:'♧',coach:'✦',hours:'◴',settings:'⚙',report:'▤'})[name]||'›';
  const labels={calendar:['時間表','Timetable'],tasks:['任務','Tasks'],blocks:['方塊','Blocks'],focus:['專注','Focus'],more:['更多','More'],goals:['目標','Goals'],wishes:['願望清單','Wishlist'],groups:['共筆群組','Groups'],coach:['AI 與教練','AI & coach'],hours:['本週時數','Weekly hours'],report:['時間報表','Reports']};
  const makeButton=(name,text,fn,cls='btn')=>{const b=document.createElement('button');b.type='button';b.className=cls;b.innerHTML=`<span class="pace-icon" aria-hidden="true">${icon(name)}</span><span>${text}</span>`;b.addEventListener('click',fn);return b;};
  const planner=document.querySelector('.planner'),rail=$('workspaceRail'),main=$('workspaceMain'),top=document.querySelector('.top');
  const baseWidget=setWidget,baseReport=setReport;
  const pages=document.createElement('div');pages.id='pacePages';planner.append(pages);
  const panels={}; Object.keys(labels).filter(k=>!['calendar','report'].includes(k)).forEach(k=>{const el=document.createElement('section');el.className='pace-panel';el.id='pace'+k[0].toUpperCase()+k.slice(1)+'Panel';el.hidden=true;el.setAttribute('aria-label',tr(...labels[k]));panels[k]=el;pages.append(el);});
  const heading=document.createElement('div');heading.className='pace-page-heading';heading.innerHTML='<div><p id="pacePageEyebrow"></p><h1 id="pacePageTitle"></h1></div><div id="pacePageActions"></div>';document.querySelector('.workspace-crumb').after(heading);
  const actions=$('pacePageActions');
  const add=makeButton('blocks',tr('新增','Add'),()=>{ if(view==='tasks'){ $('qa').focus();return;} if(view==='blocks'){ $('newModule').click();return;} if(view==='goals'){ $('newGoalBtn').click();return;} const time=Math.max(START,Math.min(END-30,new Date().getHours()*60));scrollToTime(time);const col=$('grid').querySelector(`.col[data-day="${selectedDay}"]`);if(col){const r=col.getBoundingClientRect();col.dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:r.left+20,clientY:r.top+OFF+time-START+1}));} },'btn primary pace-add');actions.append(add);
  const back=makeButton('more',tr('返回','Back'),()=>showView('more'),'btn pace-back');actions.append(back);
  const dayControls=document.createElement('div');dayControls.className='pace-calendar-controls';
  const todayButton=makeButton('focus',tr('今天','Today'),()=>{ $('thisW').click();selectedDay=(new Date().getDay()+6)%7;updateCalendar();requestAnimationFrame(()=>scrollToTime(new Date().getHours()*60+new Date().getMinutes())); },'btn');
  todayButton.id='paceToday';dayControls.append(todayButton);
  const modes=document.createElement('div');modes.className='seg pace-calendar-modes';modes.setAttribute('aria-label',tr('時間表檢視','Timetable view'));
  ['day','week'].forEach(mode=>{const b=makeButton('calendar',mode==='day'?tr('單日','Day'):tr('整週','Week'),()=>setCalendarMode(mode),'');b.dataset.calendarMode=mode;modes.append(b);});dayControls.append(modes);
  const dateOptions=makeButton('more',tr('日期選項','Day options'),()=>{const el=document.querySelectorAll('#grid > .head[data-date]')[selectedDay];el?.click();},'btn pace-date-options');dateOptions.title=tr('放假、請假或生病','Holiday, leave or sick day');dayControls.append(dateOptions);
  const dayStrip=document.createElement('div');dayStrip.id='paceDayStrip';dayStrip.setAttribute('role','group');dayStrip.setAttribute('aria-label',tr('選擇日期','Choose day'));
  main.prepend(dayControls,dayStrip);
  const warnings=document.createElement('details');warnings.id='paceWarnings';warnings.innerHTML='<summary>'+tr('本週規劃提醒','Weekly reminders')+'<span id="paceWarningCount"></span></summary>';
  const taskFilters=document.createElement('div');taskFilters.className='pace-filters';taskFilters.setAttribute('role','group');taskFilters.setAttribute('aria-label',tr('任務範圍','Task filter'));
  let taskFilter='week',blockFilter=-1,view='calendar',mode='day',selectedDay=(new Date().getDay()+6)%7,mounted=false,explicitWidget=false;
  [['today','今日到期／已安排','Due / scheduled today'],['week','本週全部','This week']].forEach(([key,zh,en])=>{const b=makeButton('tasks',tr(zh,en),()=>{taskFilter=key;filterTasks();},'btn');b.dataset.taskFilter=key;taskFilters.append(b);});panels.tasks.append(taskFilters);
  const taskEmpty=document.createElement('div');taskEmpty.className='pace-empty';taskEmpty.hidden=true;taskEmpty.textContent=tr('今天沒有到期或已安排的任務。切到「本週全部」繼續規劃。','Nothing due or scheduled today. See This week to plan ahead.');
  const categoryFilters=document.createElement('div');categoryFilters.className='pace-filters pace-category-filters';categoryFilters.setAttribute('role','group');categoryFilters.setAttribute('aria-label',tr('方塊分類','Block category'));
  [[-1,tr('全部','All')],...GROUPS.map(([name],i)=>[i,window.paceTr?.(name)||name])].forEach(([i,label])=>{const b=makeButton('blocks',label,()=>{blockFilter=i;filterBlocks();},'btn');b.dataset.blockFilter=i;categoryFilters.append(b);});panels.blocks.append(categoryFilters);
  const blockTip=document.createElement('p');blockTip.className='pace-page-hint';blockTip.textContent=tr('點選可編輯與排程；長按後拖動，會自動展開時間表。','Tap to edit or schedule. Hold and drag to reveal the timetable.');panels.blocks.append(blockTip);
  const focusIdle=document.createElement('div');focusIdle.className='pace-focus-idle';focusIdle.innerHTML='<span class="pace-focus-orbit" aria-hidden="true">◷</span><h2>'+tr('一次，只做一件事','One thing at a time')+'</h2><p>'+tr('選一個任務，給自己一段不被打擾的時間。','Choose a task and make a little room to focus.')+'</p>';focusIdle.append(makeButton('tasks',tr('選擇任務','Choose a task'),()=>showView('tasks'),'btn primary'),makeButton('blocks',tr('選擇方塊','Choose a block'),()=>showView('blocks'),'btn'));panels.focus.append(focusIdle);
  const moreGrid=document.createElement('div');moreGrid.className='pace-more-grid';panels.more.append(moreGrid);
  const descriptions={goals:tr('把大目標拆成小步驟','Small steps toward a bigger goal'),wishes:tr('為想做的事留點空間','Make room for things you enjoy'),groups:tr('一起完成，互相鼓勵','Progress, shared with care'),report:tr('回顧時間花在哪裡','A little perspective on your time'),coach:tr('你的 AI 與讀書建議','Your AI and study suggestions'),hours:tr('本週各科時數與目標','Weekly hours and targets')};
  ['goals','wishes','groups','report','coach','hours'].forEach(k=>{const b=makeButton(k,tr(...labels[k]),()=>showView(k),'pace-more-card');const d=document.createElement('small');d.textContent=descriptions[k];b.append(d);moreGrid.append(b);});
  const commands=document.createElement('div');commands.id='paceMoreCommands';commands.className='pace-more-commands';panels.more.append(commands);
  const backupButton=makeButton('tasks',tr('備份與還原','Backup & restore'),()=>openSettings('exportAll'),'btn');commands.append(backupButton);
  const groupInfo=document.createElement('div');groupInfo.className='pace-info-card';groupInfo.innerHTML='<span class="pace-kicker">'+tr('一起前進','TOGETHER')+'</span><h2>'+tr('分享完成，不分享時間表','Share progress, keep your plan private')+'</h2><p>'+tr('可選擇分享完成項目、只分享分鐘數，或完全不分享。','Share completed items, minutes only, or keep all progress private.')+'</p>';groupInfo.append(makeButton('groups',tr('管理群組與隱私','Manage groups & privacy'),()=>openSettings('grpOff'),'btn primary'));panels.groups.append(groupInfo);
  const coachInfo=document.createElement('div');coachInfo.className='pace-info-card';coachInfo.innerHTML='<h2>'+tr('用自己的 AI，照自己的步調','Your AI, at your pace')+'</h2><p>'+tr('在設定中選擇服務、管理金鑰及教練卡片。','Choose your provider, manage your key and enable coaching in Settings.')+'</p>';coachInfo.append(makeButton('coach',tr('AI 與教練設定','AI & coach settings'),()=>openSettings('aiProvider'),'btn'));panels.coach.append(coachInfo);
  const saved=[];
  const move=(el,to)=>{if(!el)return;const marker=document.createComment('pace-original-position');el.before(marker);saved.push({el,marker});to.append(el);};
  const sections={tasks:$('tasks').closest('.card'),blocks:$('palette').closest('.card'),goals:$('goals').closest('.card'),wishes:$('wishes').closest('.card'),hours:$('targets').closest('.card'),coach:$('coachCard'),groups:$('grpCard'),focus:$('nowPick')};
  function mount(){
    if(mounted)return;mounted=true;
    Object.entries(sections).forEach(([key,el])=>move(el,panels[key]));
    move($('skipCard'),panels.hours);move($('wFocus'),panels.focus);
    ['toReport','toWidget','skinBtn','installBtn'].forEach(id=>move($(id),commands));
    move($('warnbar'),warnings);document.querySelector('.calendar-topbar').after(warnings);
    $('tasks').after(taskEmpty);
    document.body.classList.remove('rail-open','rail-collapsed');top.inert=false;main.inert=false;document.querySelector('.mobile-nav').inert=false;
    const wasWidget=document.body.classList.contains('w');
    showView(view,{silent:true});
    if(wasWidget){explicitWidget=true;setWidget(true);explicitWidget=false;}
  }
  function unmount(){
    if(!mounted)return;mounted=false;
    for(const {el,marker}of saved.splice(0)){marker.replaceWith(el);}
    warnings.remove();taskEmpty.remove();pages.hidden=true;
    document.body.removeAttribute('data-pace-view');$('grid').classList.remove('pace-day-grid');
    document.querySelectorAll('.pace-filtered').forEach(el=>el.classList.remove('pace-filtered'));
    document.querySelectorAll('#grid [data-pace-active]').forEach(el=>el.removeAttribute('data-pace-active'));
    if(view==='focus')baseWidget(true);else if(view==='report')baseReport(true);
  }
  function navigateAnimation(el){if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;el.animate([{opacity:.4,translate:'0 5px'},{opacity:1,translate:'0 0'}],{duration:200,easing:'cubic-bezier(.2,.7,.2,1)'});}
  function showView(name,options={}){
    if(!labels[name])return;
    if(!mobile.matches){
      if(name==='focus')return baseWidget(true);
      if(name==='report'||name==='calendar'){baseWidget(false);return baseReport(name==='report');}
      const el=sections[name];if(name==='groups'&&el?.hidden)return openSettings('grpOff');
      if(el){baseWidget(false);el.scrollIntoView({block:'start'});if(name==='coach'&&el.hidden)openSettings('aiProvider');}return;
    }
    if(!mounted)return;
    const prev=view;view=name;document.body.dataset.paceView=name;pages.hidden=['calendar','report'].includes(name);
    if(document.body.classList.contains('w'))baseWidget(false);
    if($('wFocus').parentNode!==panels.focus)panels.focus.append($('wFocus'));
    if(document.body.classList.contains('r')!==(name==='report'))baseReport(name==='report');
    document.body.classList.remove('rail-open','rail-collapsed');top.inert=false;main.inert=false;document.querySelector('.mobile-nav').inert=false;
    Object.entries(panels).forEach(([key,el])=>el.hidden=key!==name);
    document.querySelectorAll('[data-pace-nav]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.paceNav===(['calendar','tasks','blocks','focus'].includes(name)?name:'more'))));
    $('pacePageEyebrow').textContent=name==='calendar'?tr('把時間留給重要的事','Make time for what matters'):tr('我的工作台','MY WORKSPACE');
    $('pacePageTitle').textContent=tr(...labels[name]);
    add.hidden=!['calendar','tasks','blocks','goals'].includes(name);back.hidden=['calendar','tasks','blocks','focus','more'].includes(name);
    if(name==='calendar')updateCalendar();if(name==='tasks')filterTasks();if(name==='blocks')filterBlocks();if(name==='focus')syncFocus();
    if(!options.silent&&prev!==name&&!options.fromDrag)navigateAnimation(panels[name]||main);
  }
  function setCalendarMode(next){if(!['day','week'].includes(next))return;mode=next;updateCalendar();}
  function setDay(day){selectedDay=Math.max(0,Math.min(6,Number(day)||0));updateCalendar();}
  function scrollToTime(minutes){const g=$('gridScroll');g.scrollTop=Math.max(0,Math.min(SPAN,minutes-START)-90);}
  let weekKey='';
  function updateCalendar(){
    if(!mobile.matches||!mounted)return;
    const key=ymd(state.monday);if(weekKey&&key!==weekKey)selectedDay=isThisWeek()?(new Date().getDay()+6)%7:0;weekKey=key;
    const g=$('grid');g.classList.toggle('pace-day-grid',mode==='day');
    g.querySelectorAll('.col').forEach(el=>el.dataset.paceActive=String(Number(el.dataset.day)===selectedDay));
    g.querySelectorAll('.head[data-date]').forEach((el,i)=>el.dataset.paceActive=String(i===selectedDay));
    const focusedDay=dayStrip.contains(document.activeElement)?document.activeElement.closest('[data-pace-day]')?.dataset.paceDay:null;
    dayStrip.replaceChildren();for(let i=0;i<7;i++){const d=addDays(state.monday,i);const b=makeButton('',`<small>${tr('週'+DAYN[i],['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i])}</small><b>${d.getDate()}</b>`,()=>setDay(i),'pace-day');b.dataset.paceDay=i;b.setAttribute('aria-pressed',String(i===selectedDay));b.setAttribute('aria-label',ymd(d));if(ymd(d)===ymd(new Date()))b.setAttribute('aria-current','date');dayStrip.append(b);}
    if(focusedDay!==null)dayStrip.querySelector(`[data-pace-day="${focusedDay}"]`)?.focus({preventScroll:true});
    $('gridScroll').setAttribute('aria-label',mode==='day'?tr('當日時間表，可上下捲動','Day timetable, scroll vertically'):tr('七日時間表，可上下及左右捲動','Week timetable, scroll vertically and horizontally'));
    modes.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.calendarMode===mode)));
    const selected=addDays(state.monday,selectedDay);if(view==='calendar')$('pacePageTitle').textContent=mode==='day'?tr(`${selected.getMonth()+1}月${selected.getDate()}日，週${DAYN[selectedDay]}`,selected.toLocaleDateString('en',{month:'short',day:'numeric',weekday:'short'})):tr('這一週的步調','Your week, at a glance');
    const blocks=(state.week?.blocks||[]).filter(b=>mode==='week'||b.day===selectedDay);
    if(view==='calendar')$('calendarSummary').textContent=tr(`已排 ${(blocks.reduce((a,b)=>a+b.minutes,0)/60).toFixed(1)}h · 完成 ${blocks.filter(b=>b.done).length}/${blocks.length}`,`${(blocks.reduce((a,b)=>a+b.minutes,0)/60).toFixed(1)}h planned · ${blocks.filter(b=>b.done).length}/${blocks.length} done`);
    $('workspaceViewName').textContent=mode==='day'?tr('當日安排','Day plan'):tr('七日時間表','Week plan');
  }
  function filterTasks(){
    const today=ymd(new Date()),todayDay=(new Date().getDay()+6)%7;let visible=0;
    $('tasks').querySelectorAll('.task').forEach(el=>{const id=el.querySelector('[data-tdone]')?.dataset.tdone,t=state.tasks.find(t=>t.id===id);const scheduled=isThisWeek()&&state.week.blocks.some(b=>b.taskId===id&&b.day===todayDay);const keep=!mobile.matches||taskFilter==='week'||!!t&&((!!t.due&&t.due<=today)||scheduled);el.classList.toggle('pace-filtered',!keep);if(keep)visible++;});
    taskFilters.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.taskFilter===taskFilter)));
    taskEmpty.hidden=taskFilter!=='today'||visible>0;
  }
  function filterBlocks(){
    const selected=blockFilter<0?null:GROUPS[blockFilter]?.[1];
    $('palette').querySelectorAll('.pal-group').forEach(el=>{const chip=el.querySelector('[data-drag]');const model=state.config?.modules?.find(m=>'module:'+m.id===chip?.dataset.drag);el.classList.toggle('pace-filtered',!!selected&&!selected.includes(model?.cat));});
    categoryFilters.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.blockFilter)===blockFilter)));
  }
  function syncFocus(){const active=typeof focus!=='undefined'&&!!focus;panels.focus.classList.toggle('pace-focus-live',active);focusIdle.hidden=active;}
  function openSettings(target){$('skinBtn').click();requestAnimationFrame(()=>$(target==='grpOff'&&$('grpOff')?.hidden?'grpOn':target)?.scrollIntoView({block:'center'}));}
  function reveal(target){
    if(!target||!mobile.matches)return;
    if(target.closest('#grid')){showView('calendar',{silent:true});const col=target.closest('.col');if(col)setDay(col.dataset.day);return;}
    for(const [key,p]of Object.entries(panels))if(p.contains(target)){showView(key,{silent:true});return;}
    if(target===$('weekMenu')||main.contains(target)){showView('calendar',{silent:true});return;}
    if(target.closest('dialog'))return;
    for(const [key,el]of Object.entries(sections))if(el===target||el?.contains(target)){showView(key,{silent:true});return;}
  }
  window.paceUI={showView,reveal,setDay,setCalendarMode,scrollToTime,isMobile:()=>mobile.matches,get view(){return view;},get mode(){return mode;},get day(){return selectedDay;}};
  const navigation=document.querySelector('.mobile-nav');navigation.replaceChildren();
  ['calendar','tasks','blocks','focus','more'].forEach(name=>{const b=makeButton(name,tr(...labels[name]),()=>showView(name),'');b.dataset.paceNav=name;navigation.append(b);});
  // Desktop gets every new entry as well, using the same original surfaces.
  const desktopNav=document.querySelector('.workspace-nav');
  ['wishes','focus','groups'].forEach(name=>desktopNav.append(makeButton(name,tr(...labels[name]),()=>showView(name),'')));
  document.addEventListener('click',e=>{if(e.target.closest('#toWidget')){explicitWidget=true;setTimeout(()=>explicitWidget=false,0);}},true);
  document.addEventListener('keydown',e=>{if(e.key.toLowerCase()==='w'&&!e.target.closest('input,textarea,select')){explicitWidget=true;setTimeout(()=>explicitWidget=false,0);}},true);
  setWidget=function(on){if(on&&mobile.matches&&mounted&&!explicitWidget&&typeof focus!=='undefined'&&focus){showView('focus');return;}if(on&&mounted){const record=saved.find(r=>r.el===$('wFocus'));if(record)record.marker.parentNode.insertBefore(record.el,record.marker.nextSibling);}else if(mounted&&$('wFocus').parentNode!==panels.focus)panels.focus.append($('wFocus'));baseWidget(on);};
  setReport=function(on){baseReport(on);if(mobile.matches&&mounted)showView(on?'report':'calendar');};
  let dragFrom=null,lastHoverDay=-1;
  document.addEventListener('pointerdown',e=>{dragFrom=e.target.closest('[data-drag]')?view:null;},true);
  document.addEventListener('pointermove',e=>{
    if(!mobile.matches||!drag?.moved)return;
    if(view!=='calendar')showView('calendar',{fromDrag:true});
    const day=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-pace-day]');
    if(day&&Number(day.dataset.paceDay)!==lastHoverDay){lastHoverDay=Number(day.dataset.paceDay);setDay(lastHoverDay);}
  });
  document.addEventListener('pointerup',()=>{lastHoverDay=-1;dragFrom=null;});
  document.addEventListener('pointercancel',()=>{if(dragFrom&&mobile.matches)showView(dragFrom);dragFrom=null;});
  new MutationObserver(()=>{updateCalendar();filterTasks();}).observe($('grid'),{childList:true});
  new MutationObserver(filterTasks).observe($('tasks'),{childList:true});
  new MutationObserver(filterBlocks).observe($('palette'),{childList:true});
  new MutationObserver(syncFocus).observe($('wFocus'),{attributes:true,attributeFilter:['hidden']});
  const syncWarnings=()=>{warnings.hidden=$('warnbar').hidden;warnings.querySelector('#paceWarningCount').textContent=String($('warnbar').querySelectorAll('.pill').length||'');};
  new MutationObserver(syncWarnings).observe($('warnbar'),{childList:true,attributes:true,attributeFilter:['hidden']});syncWarnings();
  mobile.addEventListener('change',()=>{mobile.matches?mount():unmount();updateCalendar();});
  if(mobile.matches)mount();else pages.hidden=true;
  if(location.hash==='#add'&&mobile.matches){showView('tasks');$('qa').focus();}
  // Existing completed/failed controls are also keyboard-accessible in single-day mode.
})();
