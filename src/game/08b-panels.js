// ---------- panels: damage chart, next-wave preview, trait details ----------
function smallPortrait(pre,k,px){const c=mk(px*2,px*2);if(!c)return null;const g=c.getContext('2d');const f=frame(pre+k,160,0,px*2);if(f&&g&&g.drawImage)g.drawImage(f,-px*.2,-px*.05,px*2.4,px*2.4);return c}
let DMGSIG='';
function uiDmg(){if(!DOM||!R)return;const el=$('dmgP'),open=!!SET.dmgOpen&&$('ovStart').hidden;$('dmgB').classList.toggle('on',open);el.hidden=!open;if(!open)return;
  const live=R.phase==='wave'&&R.b,rows=live?R.board.map(h=>({k:h.k,star:h.star,d:h.wd||0})).sort((a,b)=>b.d-a.d):R.lastDmg?R.lastDmg.rows:[];
  const sig=rows.map(r=>r.k+r.star+':'+Math.round(r.d)).join();if(sig===DMGSIG)return;const now=Date.now();if(live&&now-(uiDmg.t||0)<900)return;uiDmg.t=now;DMGSIG=sig;
  const tot=rows.reduce((a,r)=>a+r.d,0)||1,top=rows[0]?rows[0].d||1:1;
  el.innerHTML=`<h4>Damage <small>${live?'wave '+R.wave+' · live':R.lastDmg?'wave '+R.lastDmg.wave:'after your first wave'}</small></h4>`;
  for(const r of rows){const D=HEROES[r.k],d=document.createElement('div');d.className='drow';
    d.innerHTML=`<div><b>${D.n} ${'★'.repeat(r.star)}</b><div class="bar"><i style="width:${(100*r.d/top).toFixed(1)}%;background:${TRAITS[D.tr[1]].col}"></i></div></div><span>${fmt(r.d)}<br><small>${Math.round(100*r.d/tot)}%</small></span>`;
    const p=smallPortrait('h_',r.k,14);if(p)d.prepend(p);else d.prepend(document.createElement('i'));el.appendChild(d)}
  if(!rows.length)el.innerHTML+='<p class="sub" style="margin:4px 0">Each hero\'s damage shows up here during and after every wave.</p>'}
const MTAGS=k=>{const D=MON[k],t=[];if(D.boss)t.push(['BOSS','boss']);if(D.fly)t.push(['Flying: ignores your maze','fly']);if(D.sp>=1.3)t.push(['Fast','']);if(D.ar>=.3)t.push(['Armored','']);if(D.mr>=.3)t.push(['Magic resist','']);if(D.heal)t.push(['Heals','']);if(D.split)t.push(['Splits','']);if(D.summon)t.push(['Summons','']);if(D.big)t.push(['Tank','']);return t};
let WAVESIG='';
function uiWave(){if(!DOM||!R)return;const el=$('waveP'),show=(R.phase==='plan'||R.phase==='pick')&&$('ovStart').hidden&&R.nextQ;el.hidden=!show;if(!show)return;
  const road=R.field.route?R.field.route.length:0,sig=R.wave+'|'+R.nextQ.length+'|'+road+'|'+(SPR.st['m_'+R.nextQ[0].k]||0);if(sig===WAVESIG)return;WAVESIG=sig;
  const cnt={},el2={};for(const e of R.nextQ){cnt[e.k]=(cnt[e.k]||0)+1;if(e.elite)el2[e.k]=1}const ks=Object.keys(cnt).sort((a,b)=>(MON[b].boss?99:0)+cnt[b]-(MON[a].boss?99:0)-cnt[a]);
  for(const k of ks)sheet('m_'+k);
  el.innerHTML=`<b>Wave ${R.wave}</b><span class="tg road">Road ${road} tiles</span>`;
  for(const k of ks.slice(0,5)){const d=document.createElement('span');d.className='mc';d.title=MON[k].n;d.innerHTML=`×${cnt[k]}${el2[k]?'<i class="tg">elite</i>':''}`;const p=smallPortrait('m_',k,13);if(p)d.prepend(p);el.appendChild(d)}
  const tags=new Map();for(const k of ks)for(const [t,c] of MTAGS(k))tags.set(t,c);for(const [t,c] of tags){const s=document.createElement('span');s.className='tg '+c;s.textContent=t;el.appendChild(s)}}
function openTrait(t){if(!DOM)return;const T_=TRAITS[t],s=SYN[t]||{n:0,tier:-1},el=$('traitP');
  el.innerHTML=`<button class="x" type="button" aria-label="Close">×</button><h3 style="color:${T_.col}">${T_.ic} ${T_.n}</h3><p class="sub" style="text-align:left;margin:2px 0 6px">${s.n} fielded${s.tier<T_.bp.length-1?`, next bonus at ${T_.bp[s.tier+1]}`:', fully powered'}. Each different hero counts once.</p>`+
    T_.bp.map((b,i)=>`<div class="tier${i<=s.tier?' on':''}"><b>${b}</b>${T_.d(i)}</div>`).join('')+'<div class="hs"></div>';
  const hs=el.querySelector('.hs'),onB=new Set(R.board.map(h=>h.k)),own=new Set(allHeroes().map(h=>h.k));
  for(const k of HKEYS.filter(k=>HEROES[k].tr.includes(t)).sort((a,b)=>HEROES[a].c-HEROES[b].c)){const D=HEROES[k],d=document.createElement('div');d.className=onB.has(k)?'field':own.has(k)?'own':'';d.style.setProperty('--c',TIERCOL[D.c]);d.innerHTML=`<br>${D.n}<br><small>${D.c}g${onB.has(k)?' · fielded':own.has(k)?' · bench':''}</small>`;const p=smallPortrait('h_',k,23);if(p)d.prepend(p);hs.appendChild(d)}
  el.querySelector('.x').addEventListener('click',()=>{el.hidden=true});el.hidden=false;sfx('click',.3)}
function bindPanels(){if(!DOM)return;
  $('dmgB').addEventListener('click',()=>{SET.dmgOpen=!SET.dmgOpen;saveSet();DMGSIG='';uiDmg()});
  $('zoomB').addEventListener('click',()=>{ZM.z=1;applyZoom();uiZoom()});}
