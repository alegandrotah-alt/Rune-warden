// ---------- DOM interface: top bar, traits, shop, overlays, menus ----------
const DOM=typeof document!=='undefined'&&!!document.body&&!!$('app');
let toastT=0;
function toast(t){if(!DOM)return;const el=$('toast');el.textContent=t;el.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>{el.hidden=true},2200)}
function portrait(k,size){const c=mk(size*2,size*2);if(!c)return c;const g=c.getContext('2d');const f=frame('h_'+k,160,0,size*2);if(f&&g&&g.drawImage)g.drawImage(f,-size*.15,-size*.1,size*2.3,size*2.3);return c}
function onSheet(name){if(DOM&&name.startsWith('h_')){renderShop();if(!$('ovStart').hidden){clearTimeout(onSheet.t);onSheet.t=setTimeout(renderCol,200)}}if(/^props|^keep/.test(name))bgDirty=1}
function uiRefresh(){if(!DOM||!R)return;calcTraits();
  $('waveT').textContent=R.endless?`Wave ${R.wave} · Endless`:`Wave ${R.wave} / 30`;$('actT').textContent=`Act ${['I','II','III'][R.act]} · ${ACTS[R.act].n}`;
  $('goldT').textContent=R.gold;$('lvlT').textContent='Lv '+R.lvl;const need=XPNEED[R.lvl]||0;$('xpF').style.width=(R.lvl>=10?100:100*R.xp/need)+'%';$('xpT').textContent=R.lvl>=10?'max':`${R.xp}/${need}`;
  $('fieldT').textContent=`${R.board.length}/${boardMax()} heroes`;$('fieldT').style.color=R.board.length<boardMax()&&R.bench.some(Boolean)?'#ffd76a':'';
  $('hpT').textContent='♥ '+Math.ceil(R.hp);
  const st=$('streakT');st.hidden=Math.abs(R.streak)<2;st.textContent=R.streak>0?`🔥 ${R.streak} win streak`:`❄ ${-R.streak} loss streak`;
  $('xpB').disabled=R.gold<4||R.lvl>=10;$('rollB').disabled=R.gold<rerollCost();$('rollC').textContent=rerollCost()?rerollCost()+' gold':'free';
  const fb=$('fightB');if(R.phase==='wave'){fb.classList.add('speed');fb.innerHTML=`<b>×${R.speed}</b><small>speed</small>`}else{fb.classList.remove('speed');fb.innerHTML=needMap()?`<b>ROAD</b><small>choose next stop</small>`:`<b>FIGHT!</b><small>${R.wave%10===0&&R.wave<=30?'Boss wave':R.node&&R.node!=='battle'?NODES[R.node].n:'Space'}</small>`}
  const mb=$('mapB');mb.hidden=!R.map;mb.classList.toggle('on',needMap());
  renderShop();renderTraits();uiDmg();uiWave();uiZoom()}
let SHOPSIG='';
function renderShop(force){if(!DOM||!R)return;const owned={};for(const h of allHeroes())if(h.star===1)owned[h.k]=(owned[h.k]||0)+1;
  const sig=R.shop.join()+'|'+R.gold+'|'+JSON.stringify(owned)+'|'+Object.keys(SPR.img).filter(k=>SPR.st[k]===1).length;if(sig===SHOPSIG&&!force)return;SHOPSIG=sig;const box=$('cards');box.innerHTML='';
  R.shop.forEach((k,i)=>{const b=document.createElement('button');b.type='button';if(!k){b.className='hc empty';b.disabled=true;box.appendChild(b);return}
    const D=HEROES[k];b.className='hc'+(R.gold<D.c?' poor':'')+(owned[k]===2?' pair':'');b.style.setProperty('--c',TIERCOL[D.c]);
    b.innerHTML=`<span class="cost">${D.c}g</span>${owned[k]?`<span class="own">${'★'.repeat(1)}×${owned[k]}</span>`:''}<span class="nm"><b>${D.n}</b><small>${D.tr.map(t=>TRAITS[t].ic+' '+TRAITS[t].n).join(' · ')}</small></span>`;
    const p=portrait(k,38);if(p)b.prepend(p);b.addEventListener('click',()=>{if(buy(i)){uiRefresh()}else if(R.gold<D.c)toast('Not enough gold');else toast('Your bench is full')});
    b.addEventListener('contextmenu',e=>{e.preventDefault();uiInfo({k,star:1,preview:1})});box.appendChild(b)})}
let TRSIG='';
function renderTraits(){if(!DOM)return;const sig=JSON.stringify(SYN);if(sig===TRSIG)return;TRSIG=sig;const box=$('traits');box.innerHTML='';
  const list=TRAIT_ORDER.filter(t=>SYN[t]&&SYN[t].n>0).sort((a,b)=>(SYN[b].tier-SYN[a].tier)||(SYN[b].n-SYN[a].n));
  for(const t of list){const T_=TRAITS[t],s=SYN[t],d=document.createElement('div');d.className='tr8 '+(s.tier>=0?'on':'off');const next=T_.bp.find(b=>b>s.n);
    d.innerHTML=`<span class="ic" style="${s.tier>=0?`background:${T_.col}`:''}">${T_.ic}</span><span class="nm">${T_.n}</span><span class="bp">${T_.bp.map((b,i)=>i<=s.tier?`<b>${b}</b>`:b).join(' › ')} <i>(${s.n})</i></span><span class="cnt">${s.n}</span>`;
    d.title=T_.d(Math.max(0,s.tier));d.addEventListener('click',()=>openTrait(t));box.appendChild(d)}}
function uiItem(id){if(!DOM||!id)return;const el=$('info'),I=ITEMS[id];let rec='';
  if(isComp(id))rec='<p class="sub" style="text-align:left;margin:6px 0 2px">Combines with:</p><div class="recipes">'+COMPS.map(c=>{const f=RECIPE[[id,c].sort().join('+')],F=ITEMS[f];return`<div><b style="color:${ITEMS[c].col}">${ITEMS[c].ic}</b> → <b>${F.n}</b><small>${F.d}</small></div>`}).join('')+'</div>';
  else rec=`<p class="sub" style="text-align:left;margin:6px 0 0">Made from ${ITEMS[I.c[0]].n} + ${ITEMS[I.c[1]].n}.</p>`;
  el.innerHTML=`<button class="x" type="button" aria-label="Close">×</button><h3><span style="color:${I.col}">${I.ic}</span> ${I.n}</h3><div class="ab">${I.d}</div>${rec}<p class="sub" style="text-align:left;margin:6px 0 0">Drag it onto a hero. Two components on one hero combine. Three items per hero.</p>`;
  el.querySelector('.x').addEventListener('click',()=>{el.hidden=true});el.hidden=false}
function uiInfo(h){if(!DOM)return;const el=$('info');if(!h){el.hidden=true;return}const D=HEROES[h.k],s=h.preview?{dmg:D.dmg,as:D.as,rng:D.rng,crit:0}:heroStats(h);
  el.innerHTML=`<button class="x" type="button" aria-label="Close">×</button><h3>${D.n} ${'★'.repeat(h.star)}</h3><div class="tags"><span style="color:${TIERCOL[D.c]}">${D.c} gold</span>${D.tr.map(t=>`<span style="color:${TRAITS[t].col}">${TRAITS[t].ic} ${TRAITS[t].n}</span>`).join('')}</div>
   <div class="st"><div><small>Damage</small>${fmt(s.dmg)}</div><div><small>Speed</small>${s.as.toFixed(2)}</div><div><small>Range</small>${s.rng.toFixed(1)}</div><div><small>${D.dt==='m'?'Magic':'Physical'}</small>${s.crit?Math.round(s.crit*100)+'% crit':'—'}</div></div>
   <div class="ab"><b>${D.ab.n}</b> (${D.mana} mana): ${D.d}</div>${h.preview?'':`<div class="its">${(h.it||[]).map(id=>`<div><b style="color:${ITEMS[id].col}">${ITEMS[id].ic} ${ITEMS[id].n}</b><small>${ITEMS[id].d}</small></div>`).join('')||'<small>No items. Drag items from beside the bench onto a hero.</small>'}</div>
   <p class="sub" style="text-align:left;margin:6px 0 0">Health ${h.hpMax&&R.phase==='wave'?fmt(h.hp)+' / ':''}${fmt(heroMaxHp(h))}. Sells for ${sellValue(h)} gold: drag onto the shop.</p>`}`;
  el.querySelector('.x').addEventListener('click',()=>{SEL=null;el.hidden=true});el.hidden=false}
function uiSellHint(v){if(!DOM)return;const el=$('sellHint');el.hidden=!v;if(v)el.textContent=`Sell for ${v} gold`}
function fight(){if(!R||R.phase!=='plan')return;$('traitP').hidden=true;if(R.event){showEvent();return}if(needMap()){showMap();return}if(!R.board.length){toast('Drag a hero from your bench onto the field first');return}if(startWave()){uiRefresh()}}
function cycleSpeed(){R.speed=R.speed>=3?1:R.speed+1;SET.speedPref=R.speed;saveSet();uiRefresh()}
const RIC={stones:'ᚱ',tithe:'⛀',scholar:'✎',haste:'⚡',masons:'⛫',mire:'≈',eagle:'◉',arcana:'✧',runesmith:'⚒',baron:'⌾',richer:'⚖',recruit:'⚑',cheap:'↻',crit:'⚔',collector:'❖',egg:'◒',reaper:'☠',heart:'❤',kingmaker:'♛',treasury:'⛁',ascend:'★',riftlord:'✺',echo:'❂'};
function showPick(){if(!DOM)return;const box=$('pickList');box.innerHTML='';const t=RELIC[R.picks[0]]?RELIC[R.picks[0]].t:1;$('pickSub').textContent=['','Silver relics','Gold relics','Prismatic relics'][t]+'. Relics last the whole run.';
  for(const id of R.picks){const r=RELIC[id],col=['','#cfd8e0','#ffcf6a','#e6a8ff'][r.t],b=document.createElement('button');b.type='button';b.className='relic';b.style.setProperty('--c',col);
    b.innerHTML=`<span class="gem">${r.em?TRAITS[r.em].ic:RIC[id]||r.n[0]}</span><b>${r.n}</b><span>${r.d}</span>`;b.addEventListener('click',()=>{$('ovPick').hidden=true;takeRelic(id)});box.appendChild(b)}
  $('ovPick').hidden=false}
function showEnd(win){if(!DOM)return;$('endT').textContent=win?'Victory!':'The keep has fallen';
  $('endS').textContent=(win?'The Ember Dragon is slain. The realm is safe, for now.':`You held out until wave ${R.wave}.`)+(R.ascUp?` Ascension ${META.asc} unlocked!`:'')+(R.daily?` Daily best: wave ${META.daily.best}${R.dailyNew?' (new best!)':''}.`:'');
  $('endStats').innerHTML=[['Waves',R.wave-1],['Monsters slain',fmt(R.stats.kills)],['Damage dealt',fmt(R.stats.dmg)],['Longest road',R.stats.maxMaze+' tiles'],['Portal gold',Math.floor(R.portalGold)],['Gems earned','+'+R.endGems]].map(([a,b])=>`<div><b>${b}</b><small>${a}</small></div>`).join('');
  $('endlessB').hidden=!win;$('ovEnd').hidden=false;sfx(win?'level':'lose',.7)}
function hideEnd(){if(DOM)$('ovEnd').hidden=true}
let PAUSED=false;
function togglePause(on){if(!DOM||!R||R.phase==='over')return;PAUSED=on??!PAUSED;$('ovPause').hidden=!PAUSED;if(PAUSED){$('pauseS').textContent=`Wave ${R.wave} · ${R.stats.kills} monsters slain`;$('pauseRelics').innerHTML=R.relics.map(id=>{const r=RELIC[id];return`<span style="--c:${['','#cfd8e0','#ffcf6a','#e6a8ff'][r.t]}" title="${r.d}">${r.n}</span>`}).join('')||'<span style="--c:#555">No relics yet</span>'}}
// ---------- start screen ----------
function showStart(){if(!DOM)return;$('ovStart').hidden=false;$('contB').hidden=!hasSavedRun();$('bestT').textContent=META.best?`Best: wave ${META.best}${META.wins?` · ${META.wins} win${META.wins>1?'s':''}`:''}`:'';renderAsc();renderRes();renderRec();renderCol();renderSettings();MUSMODE='menu'}
// ascension picker and the daily challenge on the Play tab
let ASCSEL=null;
function renderAsc(){if(!DOM)return;const mx=META.asc||0;if(ASCSEL==null)ASCSEL=mx;ASCSEL=clamp(ASCSEL,0,mx);const box=$('ascBox');box.hidden=mx<1;
  $('ascT').textContent=ASCSEL?'Ascension '+ASCSEL:'Normal';$('ascD').innerHTML=ASCSEL?ASC.slice(0,ASCSEL).map((t,i)=>`<li${i===ASCSEL-1?' class="new"':''}>${t}</li>`).join('')+`<li class="gem">Gems ×${(1+.15*ASCSEL).toFixed(2)}</li>`:'<li>Win a run to unlock the next level.</li>';
  $('ascL').disabled=ASCSEL<=0;$('ascR').disabled=ASCSEL>=mx;
  const d=dayKey(),D=META.daily&&META.daily.d===d?META.daily:null;$('dailyS').textContent=D?`Today: best wave ${D.best} · ${D.tries} tr${D.tries>1?'ies':'y'}`:'Same shops, waves and map for everyone today.'}
function renderCol(){if(!DOM)return;$('gemsT2').textContent=META.gems;const box=$('heroList');box.innerHTML='';
  for(const k of HKEYS.slice().sort((a,b)=>(unlocked(a)-unlocked(b))||HEROES[a].c-HEROES[b].c)){const D=HEROES[k],lk=!unlocked(k),d=document.createElement('button');d.type='button';d.className='hcol'+(lk?' lk':'');d.style.setProperty('--c',TIERCOL[D.c]);d.disabled=!lk||META.gems<UNLOCK[k];
    d.innerHTML=`<b>${D.n}</b><small>${D.tr.map(t=>TRAITS[t].ic).join(' ')} · ${D.c}g</small><small>${lk?UNLOCK[k]+' gems to unlock':META.seen[k]?'Fielded':'Unlocked'}</small>`;const p=smallPortrait('h_',k,22);if(p)d.prepend(p);
    if(lk)d.addEventListener('click',()=>{if(META.gems<UNLOCK[k])return;META.gems-=UNLOCK[k];META.unl=META.unl||{};META.unl[k]=1;saveMeta();sfx('level',.6);toast(D.n+' joins the shop pool');renderCol();renderRes()});box.appendChild(d)}
  const sb=$('skinList');sb.innerHTML='';for(const S of SKINS){const ok=!S.ach||META.ach[S.ach],b=document.createElement('button');b.type='button';b.className='skin'+((SET.skin||'blue')===S.id?' on':'')+(ok?'':' lk');b.disabled=!ok;
    b.innerHTML=`<img alt="" src="gfx/${S.sh}.png"><b>${S.n}</b><small>${ok?(SET.skin||'blue')===S.id?'In use':'Tap to use':'Unlock: '+ACHN[S.ach].n}</small>`;b.addEventListener('click',()=>{SET.skin=S.id;saveSet();bgDirty=1;renderCol()});sb.appendChild(b)}}
function renderRes(){if(!DOM)return;$('gemsT').textContent=META.gems;if($('gemsT2'))$('gemsT2').textContent=META.gems;const box=$('resList');box.innerHTML='';
  for(const r of RES){const l=rank(r.id),max=l>=r.max,cost=r.cost[l],b=document.createElement('button');b.type='button';b.className='node'+(max?' max':'');b.disabled=max||META.gems<cost;
    b.innerHTML=`<b>${r.n} ${'●'.repeat(l)}${'○'.repeat(r.max-l)}</b><small>${r.d(Math.max(1,max?l:l+1))}</small><small>${max?'Maxed':cost+' gems'}</small>`;
    b.addEventListener('click',()=>{if(b.disabled)return;META.gems-=cost;META.res[r.id]=l+1;saveMeta();sfx('pick',.6);renderRes()});box.appendChild(b)}}
function renderRec(){if(!DOM)return;$('recStats').innerHTML=[['Runs',META.runs],['Best wave',META.best],['Wins',META.wins||0],['Best endless',META.bestEndless||0],['Monsters slain',fmt(META.kills||0)],['Heroes fielded',Object.keys(META.seen).length+'/'+HKEYS.length],['Ascension',META.asc||0],['Today\'s daily',META.daily&&META.daily.d===dayKey()?'wave '+META.daily.best:'not played']].map(([a,b])=>`<div><b>${b}</b><small>${a}</small></div>`).join('');
  const box=$('achList');box.innerHTML='';for(const a of ACH){const got=!!META.ach[a.id],d=document.createElement('div');d.className='ach'+(got?' got':'')+(a.hidden?' hid':'');d.innerHTML=`<b>${a.hidden&&!got?'??? Secret':a.n}</b><small>${a.hidden&&!got?a.hidden:a.d}</small><small>${got?'Earned':'+'+a.g+' gems'}</small>`;box.appendChild(d)}}
function renderSettings(){if(!DOM)return;const box=$('setList');box.innerHTML='';const row=(label,ctl)=>{const d=document.createElement('div');d.className='set';d.innerHTML=`<b>${label}</b>`;d.appendChild(ctl);box.appendChild(d)};
  const slider=k=>{const i=document.createElement('input');i.type='range';i.min=0;i.max=1;i.step=.05;i.value=SET[k];i.addEventListener('input',()=>{SET[k]=+i.value;saveSet()});return i};
  const seg=(k,opts)=>{const d=document.createElement('div');d.className='seg';for(const [v,l] of opts){const b=document.createElement('button');b.type='button';b.textContent=l;b.className=SET[k]===v?'on':'';b.addEventListener('click',()=>{SET[k]=v;saveSet();renderSettings();if(k==='quality')resize()});d.appendChild(b)}return d};
  row('Music',slider('music'));row('Sound effects',slider('sfx'));row('Screen shake',seg('shake',[[1,'On'],[.4,'Low'],[0,'Off']]));row('Damage numbers',seg('nums',[[1,'On'],[0,'Off']]));row('Graphics',seg('quality',[['auto','Auto'],['high','High'],['low','Low']]));{const b=document.createElement('button');b.type='button';b.textContent=META.tut?'Replay':'On';b.className='seg';b.style.cssText='border:1px solid rgba(255,207,106,.3);background:rgba(0,0,0,.25);border-radius:8px;padding:4px 10px';b.addEventListener('click',()=>{META.tut=0;saveMeta();toast('The tutorial will play on your next new run');renderSettings()});row('Tutorial',b)}}
function startGame(o){clearRun();newRun(o);$('ovStart').hidden=true;hideEnd();MUSMODE='game';bgDirty=1;uiRefresh();if(!o||!o.daily)tutStart();else toast(`Daily challenge ${R.daily}: ascension 2, and you start with ${RELIC[R.dailyRelic].n}`);if(needMap()&&!TUT)showMap()}
function bindUI(){if(!DOM)return;bindPanels();bindTut();bindMap();
  $('ascL').addEventListener('click',()=>{ASCSEL--;renderAsc()});$('ascR').addEventListener('click',()=>{ASCSEL++;renderAsc()});
  $('dailyB').addEventListener('click',()=>startGame({daily:dayKey()}));
  $('xpB').addEventListener('click',()=>{if(buyXP())uiRefresh()});$('rollB').addEventListener('click',()=>{if(reroll())uiRefresh()});
  $('fightB').addEventListener('click',()=>{if(R.phase==='plan')fight();else if(R.phase==='wave')cycleSpeed()});
  $('pauseB').addEventListener('click',()=>togglePause());$('resumeB').addEventListener('click',()=>togglePause(false));
  $('quitB').addEventListener('click',()=>{togglePause(false);runOver(false)});
  $('playB').addEventListener('click',()=>startGame({asc:ASCSEL||0}));
  $('contB').addEventListener('click',()=>{if(loadRun()){$('ovStart').hidden=true;MUSMODE='game';bgDirty=1;uiRefresh();if(R.phase==='pick')showPick();else if(R.event)showEvent();else if(needMap())showMap()}});
  $('againB').addEventListener('click',()=>startGame(R&&R.daily?{daily:dayKey()}:{asc:R?R.asc:0}));
  $('menuB').addEventListener('click',()=>{hideEnd();showStart()});$('endlessB').addEventListener('click',()=>{goEndless();MUSMODE='game'});
  document.querySelectorAll('.tabs button').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.tabs button').forEach(x=>x.classList.toggle('on',x===b));document.querySelectorAll('#ovStart .tab').forEach(t=>t.hidden=t.id!==b.dataset.tab);ensureAudio()}));
  document.addEventListener('pointerdown',e=>{const b=e.target&&e.target.closest&&e.target.closest('button');if(b&&!b.disabled){ensureAudio();sfx('click',.3)}},true);
  window.addEventListener('resize',()=>{measure();resize()});document.addEventListener('visibilitychange',()=>{if(document.hidden&&R&&R.phase==='wave')togglePause(true)})}
function measure(){if(!DOM)return;const s=$('shop');if(s&&s.getBoundingClientRect)UI.shopH=s.getBoundingClientRect().height;document.documentElement.style.setProperty('--shopH',UI.shopH+'px')}
