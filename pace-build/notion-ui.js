/* Presentation-only enhancement. Existing app nodes/handlers and persisted data stay intact. */
(() => {
  const $ = id => document.getElementById(id);
  const en = window.paceLang?.() === 'en';
  const tr = (zh, english) => en ? english : zh;
  const icons = {
    calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18M8 15h2M14 15h2"/>',
    report:'<path d="M4 3v18h17M9 17v-5M14 17V7M19 17V4"/>',
    goal:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r=".5"/>',
    blocks:'<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/>',
    tasks:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="m8 9 2 2 5-5M8 16h8"/>',
    menu:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16M13 9h4M13 13h4"/>',
    close:'<path d="m9 7-5 5 5 5M16 5v14"/>',
    settings:'<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3"/><circle cx="15" cy="17" r="3"/>',
    note:'<path d="M4 3h16v12l-6 6H4zM14 21v-6h6"/>',
    help:'<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 1 1 4 3c-1 .5-1 1-1 2M12 17h.01"/>',
    download:'<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>'
  };
  const icon = name => `<span class="nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${icons[name]}</svg></span>`;
  const button = (label, name, action, cls='') => {
    const b=document.createElement('button'); b.type='button'; b.className=cls;
    b.innerHTML=icon(name)+`<span>${label}</span>`; b.addEventListener('click',action); return b;
  };
  const rail=document.querySelector('.rail'), top=document.querySelector('.top');
  const main=document.querySelector('.layout > div:last-child'); main.classList.add('workspace-main');
  rail.id='workspaceRail'; rail.setAttribute('aria-label',tr('工作台','Workspace'));
  main.id='workspaceMain'; main.tabIndex=-1;
  const skip=document.createElement('a'); skip.className='skip-link'; skip.href='#workspaceMain'; skip.textContent=tr('跳到時間表','Skip to planner'); document.body.prepend(skip);

  const railHeader=document.createElement('div'); railHeader.className='rail-header';
  const brand=document.querySelector('.brandname');
  brand.innerHTML='<img src="icon.svg" alt=""><span>'+tr('步調','Pace')+'<small class="brand-subtitle">BLOCK PLANNER</small></span>';
  railHeader.append(brand);
  const close=button(tr('收合','Close'),'close',()=>setRail(false),'icon-btn rail-close');
  close.querySelector('span:last-child').remove(); close.setAttribute('aria-label',tr('收合工作台','Close workspace')); railHeader.append(close);
  const nav=document.createElement('nav'); nav.className='workspace-nav'; nav.setAttribute('aria-label',tr('主要導覽','Main navigation'));
  const viewtabs=document.querySelector('.viewtabs');
  $('toGrid').insertAdjacentHTML('afterbegin',icon('calendar'));
  $('toReport').insertAdjacentHTML('afterbegin',icon('report'));
  $('toGrid').insertAdjacentHTML('beforeend','<span class="nav-key" aria-hidden="true">T</span>');
  $('toReport').insertAdjacentHTML('beforeend','<span class="nav-key" aria-hidden="true">R</span>');
  nav.append(viewtabs);
  const label=document.createElement('div'); label.className='nav-section-label'; label.textContent=tr('我的規劃','MY PLANNING'); nav.append(label);
  const sections=[['goals','目標','Goals','goal'],['palette','方塊','Blocks','blocks'],['tasks','這週任務','Weekly tasks','tasks']];
  sections.forEach(([id,zh,english,i])=>{
    const section=$(id).closest('.card'); section.id='section-'+id;
    nav.append(button(tr(zh,english),i,()=>{
      window.paceUI?.reveal(section);
      section.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
      const target=section.querySelector('button,input'); target?.focus({preventScroll:true});
    }));
  });
  rail.prepend(railHeader,nav);
  // Keep verbose instructions available without dominating the daily workspace.
  const fold=(el,labelZh,labelEn)=>{
    if(!el)return; const details=document.createElement('details'); details.className='help-details';
    const summary=document.createElement('summary'); summary.textContent=tr(labelZh,labelEn); details.append(summary);
    el.before(details); details.append(el);
  };
  fold($('palette').previousElementSibling,'操作說明與快捷鍵','How to plan & keyboard shortcuts');
  fold(document.querySelector('#quickAdd .hint'),'快速輸入提示','Quick entry tips');

  const crumb=document.createElement('div'); crumb.className='workspace-crumb';
  crumb.innerHTML='<span class="mobile-brand"><img src="icon.svg" alt="">'+tr('步調','Pace')+'</span><span class="crumb-label">'+tr('我的工作台','My workspace')+'</span><span class="crumb-divider">/</span><strong>'+tr('本週計畫','Weekly plan')+'</strong>';
  crumb.append($('status')); top.prepend(crumb);
  const toggle=button(tr('工作台','Workspace'),'menu',()=>setRail(true),'icon-btn workspace-toggle');
  toggle.querySelector('span:last-child').remove(); toggle.setAttribute('aria-label',tr('展開工作台','Open workspace')); toggle.setAttribute('aria-controls','workspaceRail');
  top.insertBefore(toggle,document.querySelector('.brand'));

  const bar=document.createElement('div'); bar.className='calendar-topbar';
  bar.innerHTML='<h2 class="calendar-heading">'+icon('calendar')+'<span id="workspaceViewName">'+tr('時間表','Timetable')+'</span></h2><div class="calendar-summary" id="calendarSummary"></div><span class="calendar-view-label">'+icon('calendar')+tr('週視圖','Week view')+'</span>';
  main.prepend(bar);
  const hint=document.createElement('div'); hint.className='calendar-hint';
  hint.innerHTML=icon('help')+'<span>'+tr('點空白處安排時間 · 拖曳方塊調整行程 · 左右滑動查看整週','Click an empty time to plan · Drag blocks to reschedule · Scroll sideways for the full week')+'</span>'; main.append(hint);
  const grid=$('gridScroll'); grid.tabIndex=0; grid.setAttribute('role','region'); grid.setAttribute('aria-label',tr('七日時間表，可上下及左右捲動','Seven-day timetable, scroll vertically and horizontally'));
  $('warnbar').tabIndex=0; $('warnbar').setAttribute('role','region'); $('warnbar').setAttribute('aria-label',tr('本週排程提醒，可捲動查看全部','Weekly planning reminders, scroll to see all'));
  const backdrop=document.createElement('button'); backdrop.className='rail-backdrop'; backdrop.tabIndex=-1; backdrop.setAttribute('aria-label',tr('關閉工作台','Close workspace')); backdrop.addEventListener('click',()=>setRail(false)); document.body.append(backdrop);
  const mobile=document.createElement('nav'); mobile.className='mobile-nav'; mobile.setAttribute('aria-label',tr('手機導覽','Mobile navigation'));
  const mobileGrid=button(tr('時間表','Plan'),'calendar',()=>{ $('toGrid').click(); setRail(false,false); });
  const mobileWork=button(tr('工作台','Workspace'),'blocks',()=>setRail(true)); mobileWork.setAttribute('aria-controls','workspaceRail');
  const mobileReport=button(tr('報表','Reports'),'report',()=>{ if(!document.body.classList.contains('r'))$('toReport').click(); setRail(false,false); });
  const mobileSettings=button(tr('設定','Settings'),'settings',()=>{ setRail(false,false); $('skinBtn').click(); });
  mobile.append(mobileGrid,mobileWork,mobileReport,mobileSettings); document.body.append(mobile);
  const utilLabel=document.createElement('div'); utilLabel.className='nav-section-label'; utilLabel.textContent=tr('工具','TOOLS');
  const utilities=document.createElement('nav'); utilities.className='workspace-nav rail-utilities'; utilities.append(utilLabel);
  [['toWidget','便利貼','Sticky note','note'],['skinBtn','設定','Settings','settings'],['installBtn','安裝 App','Install app','download']].forEach(([id,zh,english,i])=>{
    const b=button(tr(zh,english),i,()=>{ setRail(false,false); $(id).click(); });
    if(id==='installBtn') { const syncInstall=()=>{ b.hidden=$(id).hidden; }; new MutationObserver(syncInstall).observe($(id),{attributes:true,attributeFilter:['hidden']}); syncInstall(); }
    utilities.append(b);
  });
  // Tools remain reachable near the top on touch screens and at the foot of the rail on desktop.
  rail.append(utilities);
  const narrow=matchMedia('(max-width:1199px)'); let returnFocus=null;
  function setRail(open,restore=true) {
    if(open) returnFocus=document.activeElement;
    document.body.classList.toggle('rail-open',open && narrow.matches);
    document.body.classList.toggle('rail-collapsed',!open && !narrow.matches);
    toggle.setAttribute('aria-expanded',String(open)); mobileWork.setAttribute('aria-expanded',String(open));
    const trap=open && narrow.matches;
    top.inert=trap; main.inert=trap; mobile.inert=trap;
    if(open && narrow.matches) close.focus({preventScroll:true});
    if(!open && restore && returnFocus?.isConnected) returnFocus.focus({preventScroll:true});
    if(!open && document.activeElement && rail.contains(document.activeElement)) (narrow.matches ? mobileWork : toggle).focus({preventScroll:true});
  }
  narrow.addEventListener('change',()=>{
    document.body.classList.remove('rail-open','rail-collapsed'); top.inert=false; main.inert=false; mobile.inert=false;
    toggle.setAttribute('aria-expanded',String(!narrow.matches)); mobileWork.setAttribute('aria-expanded','false');
  });
  toggle.setAttribute('aria-expanded',String(!narrow.matches)); mobileWork.setAttribute('aria-expanded','false');
  // The drawer yields to the original drag engine when a drag starts, so the calendar remains a drop target.
  document.addEventListener('pointermove',()=>{ if(narrow.matches && document.body.classList.contains('rail-open') && typeof drag!=='undefined' && drag?.moved) setRail(false,false); });
  $('toGrid').addEventListener('click',()=>{ if(narrow.matches)setRail(false,false); });
  $('toReport').addEventListener('click',()=>{ if(narrow.matches)setRail(false,false); });
  document.addEventListener('keydown',e=>{
    if(document.querySelector('dialog[open]'))return;
    if(e.key==='Escape' && document.body.classList.contains('rail-open')) { e.preventDefault(); setRail(false); return; }
    if(e.key==='Tab' && document.body.classList.contains('rail-open')) {
      const items=[...rail.querySelectorAll('button,input,select,textarea,summary,[tabindex="0"],a[href]')].filter(el=>!el.disabled && el.getClientRects().length);
      const first=items[0],last=items.at(-1);
      if(e.shiftKey && document.activeElement===first) { e.preventDefault(); last?.focus(); }
      else if(!e.shiftKey && document.activeElement===last) { e.preventDefault(); first?.focus(); }
    }
    if(e.key.toLowerCase()==='n' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.target.closest?.('input,textarea,select')) {
      if(window.paceUI?.isMobile())window.paceUI.showView('tasks'); else setRail(true);
      $('qa').scrollIntoView({block:'center'});
    }
    if(e.key==='Enter' || e.key===' ') {
      const target=e.target.closest?.('.blk,[data-drag^="module:"],[data-toggle],[data-fail]');
      if(!target || e.target.matches('input'))return;
      e.preventDefault(); e.stopImmediatePropagation();
      if(target.dataset.toggle)toggleDone(target.dataset.toggle);
      else if(target.dataset.fail)toggleFail(target.dataset.fail);
      else if(target.dataset.fixed)target.click();
      else if(target.dataset.bid)openBlock(target.dataset.bid);
      else if(target.dataset.drag?.startsWith('module:'))openModule(target.dataset.drag.slice(7));
    }
  },true);
  const revealQuickAdd=event=>{ if((event?.newURL ? new URL(event.newURL).hash : location.hash)==='#add'){if(window.paceUI?.isMobile())window.paceUI.showView('tasks'); else setRail(true); $('qa').focus();} };
  addEventListener('hashchange',revealQuickAdd); revealQuickAdd();
  function enhance() {
    document.querySelectorAll('.blk,[data-drag^="module:"],[data-toggle],[data-fail]').forEach(el=>{
      if(!el.matches('button')) { el.tabIndex=0; el.setAttribute('role','button'); }
      if(el.title)el.setAttribute('aria-label',el.title);
    });
    const blocks=typeof state!=='undefined' ? state.week?.blocks||[] : [];
    const hours=(blocks.reduce((sum,b)=>sum+b.minutes,0)/60).toFixed(1),done=blocks.filter(b=>b.done).length;
    $('calendarSummary').innerHTML=tr(`<span>已排 <b>${hours}h</b></span><span>·</span><span>完成 <b>${done}/${blocks.length}</b></span>`,`<span>Planned <b>${hours}h</b></span><span>·</span><span>Done <b>${done}/${blocks.length}</b></span>`);
  }
  new MutationObserver(enhance).observe($('grid'),{childList:true});
  new MutationObserver(enhance).observe($('palette'),{childList:true}); enhance();
  function syncView() {
    const isReport=document.body.classList.contains('r');
    $('workspaceViewName').textContent=isReport?tr('時間報表','Time reports'):tr('時間表','Timetable');
    mobileGrid.setAttribute('aria-pressed',String(!isReport)); mobileReport.setAttribute('aria-pressed',String(isReport));
    document.querySelector('.calendar-view-label').hidden=isReport;
    if(document.body.classList.contains('w') && document.body.classList.contains('rail-open'))setRail(false,false);
  }
  new MutationObserver(syncView).observe(document.body,{attributes:true,attributeFilter:['class']}); syncView();
  // Correct the default skin's display copy without writing any saved preference.
  const defaultSkin=typeof SKINS!=='undefined' && SKINS.find(s=>s.id==='default');
  if(defaultSkin) { defaultSkin.name=tr('極簡淺色','Minimal light'); defaultSkin.note=tr('純白工作台、柔和綠色，預設維持淺色','A white workspace with soft green accents'); defaultSkin.sw=['#ffffff','#f7f7f5','#43866b','#e9eff7','#eaf2e7']; }
  document.querySelectorAll('dialog').forEach(dialog=>{
    if(dialog.hasAttribute('aria-label')||dialog.hasAttribute('aria-labelledby'))return;
    const title=dialog.querySelector('.dtitle'); if(title){ if(!title.id)title.id=dialog.id+'Heading'; dialog.setAttribute('aria-labelledby',title.id); }
  });
  $('toast').setAttribute('role','status'); $('status').setAttribute('role','status');
})();
