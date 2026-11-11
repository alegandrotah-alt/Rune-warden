// ---------- panels: damage chart, next-wave preview, trait details ----------
function smallPortrait(pre,k,px){const c=mk(px*4,px*4);if(!c)return null;const g=c.getContext('2d');const f=frame(pre+k,160,0,px*4);if(f&&g&&g.drawImage){g.imageSmoothingQuality='high';g.drawImage(f,-px*.4,-px*.1,px*4.8,px*4.8)}return c}
let DMGSIG='';
function uiDmg(){if(!DOM||!R)return;const el=$('dmgP'),open=!!SET.dmgOpen&&$('ovStart').hidden;$('dmgB').classList.toggle('on',open);el.hidden=!open;if(!open)return;
  if(SET.ptab==='rel'){const sig='rel|'+R.relics.join()+'|'+R.potions.join();if(sig===DMGSIG)return;DMGSIG=sig;el.innerHTML=panelTabs()+relicsHTML();bindTabs(el);return}
  const live=R.phase==='wave'&&R.b,rows=(live?R.board.map(h=>({k:h.k,star:h.star,d:h.wd||0})).sort((a,b)=>b.d-a.d):R.lastDmg?R.lastDmg.rows:[]).slice(0,H<=430?(live?3:6):10);
  const sig=rows.map(r=>r.k+r.star+':'+Math.round(r.d)).join();if(sig===DMGSIG)return;const now=Date.now();if(live&&now-(uiDmg.t||0)<900)return;uiDmg.t=now;DMGSIG=sig;
  const tot=rows.reduce((a,r)=>a+r.d,0)||1,top=rows[0]?rows[0].d||1:1;
  el.innerHTML=panelTabs()+`<h4>Damage <small>${live?'floor '+R.wave+' · live':R.lastDmg?'floor '+R.lastDmg.wave:'after your first fight'}</small></h4>`;bindTabs(el);
  for(const r of rows){const D=HEROES[r.k],d=document.createElement('div');d.className='drow';
    d.innerHTML=`<div><b>${D.n} ${'★'.repeat(r.star)}</b><div class="bar"><i style="width:${(100*r.d/top).toFixed(1)}%;background:${TRAITS[D.tr[1]].col}"></i></div></div><span>${fmt(r.d)}<br><small>${Math.round(100*r.d/tot)}%</small></span>`;
    const p=smallPortrait('h_',r.k,14);if(p)d.prepend(p);else d.prepend(document.createElement('i'));el.appendChild(d)}
  if(!rows.length)el.innerHTML+='<p class="sub" style="margin:4px 0">Each hero\'s damage shows up here during and after every wave.</p>'}
const MTAGS=k=>{const D=MON[k],t=[];if(D.boss)t.push(['BOSS','boss']);if(D.fly)t.push(['Flying: ignores your maze','fly']);if(D.sp>=1.3)t.push(['Fast','']);if(D.ar>=.3)t.push(['Armored','']);if(D.mr>=.3)t.push(['Magic resist','']);if(D.heal)t.push(['Heals','']);if(D.split)t.push(['Splits','']);if(D.summon)t.push(['Summons','']);if(D.big)t.push(['Tank','']);if(D.beh==='hunt')t.push(['Hunts heroes: stops to fight','hunt']);if(D.beh==='rush')t.push(['Rushes the keep: ignores heroes','rush']);if(D.beh==='phase')t.push(['Phases out of reach','']);if(D.sig)t.push([D.sig.n+': '+D.sig.d,'boss']);if(D.final)t.push(['Takes at most 1.6% of its health a second','boss'],['Regrows health','boss'],['Beat of Death: grows every beat','boss'],['Sheds an immune shell every quarter','boss'],['Seizes your top hero','boss'],['Eats runes, opens rifts','boss']);return t};
let WAVESIG='';
// which gates the next wave comes through, shortest road first
function gateTag(){const F=R.field,G=F.gates||[];if(G.length<2)return'';const act=[...new Set(R.nextQ.map(e=>e.g||0))];const nm=g=>g.k==='west'?'West':g.k==='north'?'North':g.k==='south'?'South':'Breach';
  const sh=Math.min(...act.map(i=>((i?F.routes&&F.routes[i]:F.route)||[]).length||99));return `<span class="tg gate" title="Monsters come through these gates. The shortest road is ${sh} hexes.">${act.length>1?act.length+' gates':'1 gate'}: ${act.map(i=>nm(G[i])).join(', ')}</span>`}
function uiWave(){if(!DOM||!R)return;const el=$('waveP'),show=R.phase==='plan'&&$('ovStart').hidden&&R.nextQ&&(!R.map||R.map.next||!needMap())&&!has('dome');el.hidden=!show;if(!show)return;
  const road=R.field.route?R.field.route.length:0,sig=R.wave+'|'+R.nextQ.length+'|'+road+'|'+(R.field.routes||[]).map(r=>r.length).join(',')+'|'+R.node+'|'+(SPR.st['m_'+R.nextQ[0].k]||0);if(sig===WAVESIG)return;WAVESIG=sig;
  const cnt={},el2={};for(const e of R.nextQ){cnt[e.k]=(cnt[e.k]||0)+1;if(e.elite)el2[e.k]=1}const ks=Object.keys(cnt).sort((a,b)=>(MON[b].boss?99:0)+cnt[b]-(MON[a].boss?99:0)-cnt[a]);
  for(const k of ks)sheet('m_'+k);
  const N=R.node&&R.node!=='battle'?NODES[R.node]:null;el.innerHTML=`<b>Wave ${R.wave}</b>${N?`<span class="tg" style="color:${N.col};border-color:${N.col}">${N.ic} ${N.n}</span>`:''}<span class="tg road">Road ${road} hexes</span>`+gateTag();
  for(const k of ks.slice(0,5)){const d=document.createElement('span');d.className='mc';d.title=MON[k].n;d.innerHTML=`×${cnt[k]}${el2[k]?'<i class="tg">elite</i>':''}`;const p=smallPortrait('m_',k,13);if(p)d.prepend(p);el.appendChild(d)}
  const tags=new Map();for(const k of ks)for(const [t,c] of MTAGS(k))tags.set(t,c);for(const [t,c] of tags){const s=document.createElement('span');s.className='tg '+c;s.textContent=t;el.appendChild(s)}}
function openTrait(t){if(!DOM)return;const T_=TRAITS[t],s=SYN[t]||{n:0,tier:-1},el=$('traitP');
  el.innerHTML=`<button class="x" type="button" aria-label="Close">×</button><h3 style="color:${T_.col}">${T_.ic} ${T_.n}</h3><p class="sub" style="text-align:left;margin:2px 0 6px">${s.n} fielded${s.tier<T_.bp.length-1?`, next bonus at ${T_.bp[s.tier+1]}`:', fully powered'}. Each different hero counts once.</p>`+
    T_.bp.map((b,i)=>`<div class="tier${i<=s.tier?' on':''}"><b>${b}</b>${T_.d(i)}</div>`).join('')+'<div class="hs"></div>';
  const hs=el.querySelector('.hs'),onB=new Set(R.board.map(h=>h.k)),own=new Set(allHeroes().map(h=>h.k));
  for(const k of HKEYS.filter(k=>HEROES[k].tr.includes(t)).sort((a,b)=>HEROES[a].c-HEROES[b].c)){const D=HEROES[k],d=document.createElement('div');d.className=onB.has(k)?'field':own.has(k)?'own':'';d.style.setProperty('--c',TIERCOL[D.c]);d.innerHTML=`<br>${D.n}<br><small>${D.c}g${onB.has(k)?' · fielded':own.has(k)?' · bench':''}</small>`;const p=smallPortrait('h_',k,23);if(p)d.prepend(p);hs.appendChild(d)}
  el.querySelector('.x').addEventListener('click',()=>{el.hidden=true});el.hidden=false;sfx('click',.3)}
const panelTabs=()=>`<div class="ptabs"><button type="button" data-p="dmg" class="${SET.ptab!=='rel'?'on':''}">${icon('bars')} Damage</button><button type="button" data-p="rel" class="${SET.ptab==='rel'?'on':''}">${icon('gem')} Relics ${R.relics.length}</button></div>`;
function bindTabs(el){el.querySelectorAll('.ptabs button').forEach(b=>b.addEventListener('click',()=>{SET.ptab=b.dataset.p;saveSet();DMGSIG='';uiDmg()}))}
function relicsHTML(){const col=['','#cfd8e0','#ffcf6a','#e6a8ff','#ff8a6a'];return `<h3>Relics</h3>`+(R.relics.length?R.relics.map(id=>{const r=RELIC[id];return`<div class="rl" style="--c:${col[r.t]}"><span class="gem">${r.em?TRAITS[r.em].ic:RIC[id]||r.n[0]}</span><div><b>${r.n}</b><small>${r.d}</small></div></div>`}).join(''):'<p class="sub">No relics yet. Elites, chests, the merchant, events and bosses give them.</p>')+
    `<h3>Potions</h3>`+(R.potions.length?R.potions.map(id=>`<div class="rl" style="--c:${POTIONS[id].col}"><span class="gem">${POTIONS[id].ic}</span><div><b>${POTIONS[id].n}</b><small>${POTIONS[id].d}${POTIONS[id].wave?' (during a wave)':POTIONS[id].plan?' (between waves)':''}</small></div></div>`).join(''):'<p class="sub">No potions. Tap a potion at the top of the screen to drink it.</p>')}
function openRelics(){SET.dmgOpen=true;SET.ptab='rel';saveSet();DMGSIG='';uiDmg()}
function bindPanels(){if(!DOM)return;$('relB').addEventListener('click',openRelics);for(const [id,n] of [['mapB','flag'],['dmgB','bars']])$(id).innerHTML=icon(n)+($(id).innerHTML.includes('relN')?'':'');$('dmgB').insertAdjacentHTML('beforeend','<small id="relN2"></small>');
  $('dmgB').addEventListener('click',()=>{SET.dmgOpen=!SET.dmgOpen;saveSet();DMGSIG='';uiDmg()});
  $('zoomOB').addEventListener('click',()=>zoomStep(1/1.3));$('zoomIB').addEventListener('click',()=>zoomStep(1.3));uiZoom();}
