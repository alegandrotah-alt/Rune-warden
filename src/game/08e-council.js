// ---------- the war council screen: the Constellation, and the pacts on offer for the coming fight ----------
let CNTAB='stars',CNSEL=null,CHSEL=null;
function uiCouncil(){if(!DOM||!R)return;const b=$('cnB');if(!b)return;const off=R.phase==='plan'?pactOffer():[],fresh=off.length>0&&R.pactSeen!==R.wave&&R.wave>1,n=R.tp||0;
  b.querySelector('small').textContent=n||'';b.classList.toggle('on',n>0||fresh);b.classList.toggle('pact',!!(R.pact&&R.pact.length));
  if(n>0&&R.wave>1)tip('stars');if(fresh&&R.wave>=3)tip('pacts');if(R.stones.some(stK))tip('attuned');if(R.shopEd&&R.shopEd.some(Boolean)&&R.phase==='plan')tip('marked')}
function openCouncil(tab){if(!DOM||!R)return;CNTAB=tab||(R.tp>0?'stars':R.phase==='plan'&&pactOffer().length&&R.pactSeen!==R.wave?'pacts':CNTAB);CNSEL=null;renderCouncil();$('ovCn').hidden=false}
function starsSVG(){const S=100;let ln='',nd='';
  for(const s of STARS)for(const o of s.ln){const a=STARN[o];ln+=`<line x1="${a.x*S}" y1="${a.y*S}" x2="${s.x*S}" y2="${s.y*S}" class="${starOwned(s.id)&&starOwned(o)?'own':''}"/>`}
  for(const s of STARS){const own=starOwned(s.id),near=!own&&starOpen(s.id),r=[5.5,8,11,9][s.t];
    nd+=`<g class="sn t${s.t}${own?' own':near?(R.tp>0?' can':' near'):''}${CNSEL===s.id?' sel':''}" data-id="${s.id}" style="--c:${s.col}" transform="translate(${s.x*S},${s.y*S})">${s.t===2?`<rect x="${-r}" y="${-r}" width="${2*r}" height="${2*r}" transform="rotate(45)"/>`:`<circle r="${r}"/>`}<circle class="hb" r="13"/></g>`}
  return `<svg viewBox="-112 -112 224 224" role="img" aria-label="The Constellation">${ln}${nd}</svg>`}
function starInfo(){const s=CNSEL&&STARN[CNSEL],n=R.tp||0;
  if(!s){const ks=(R.tree||[]).filter(id=>STARN[id].t===2).map(id=>STARN[id].n);return `<p class="sub">You gain a point with every level and from every boss. Spend it on a star that touches one you own. The six outer stars are <b>keystones</b>: a great power, and a price.</p>`+(ks.length?`<p class="sub">Keystones held: <b>${ks.join(', ')}</b></p>`:'')+`<div class="arms">${ARMS.map(a=>`<span style="--c:${a.col}">${a.n}</span>`).join('')}</div>`}
  const own=starOwned(s.id),open=starOpen(s.id),kind=['Star','Greater star','Keystone',''][s.t];
  return `<h3 style="color:${s.col}">${s.n}</h3>${kind?`<em>${kind}</em>`:''}<p>${s.d}${s.t===0&&!/\.$/.test(s.d)?'.':''}</p>`+(own?'<p class="sub">Yours.</p>':open?(n>0?`<button id="cnTake" type="button" class="primary">Take (1 point)</button>`:'<p class="sub">No points to spend. You gain one with every level and from every boss.</p>'):'<p class="sub">Out of reach: take a star next to it first.</p>')}
function pactsHTML(){const off=pactOffer(),plan=R.phase==='plan';
  if(R.final)return '<p class="sub">No pacts before the Rune Devourer.</p>';if(!off.length)return '<p class="sub">Pacts are offered before every fight from your second run on.</p>';
  return `<p class="sub">${plan?'Sign up to two for the coming fight. Each makes it harder and pays when the fight ends with the keep standing.':'Signed for this fight:'}</p><div class="pacts">`+off.filter(id=>plan||R.pact.includes(id)).map(id=>{const p=PACT[id],on=R.pact.includes(id);return `<button type="button" class="pact${on?' on':''}" data-id="${id}"${plan?'':' disabled'}><b>${p.n}</b><span>${p.d}</span><em>Pays ${pactReward(p)}</em></button>`}).join('')+'</div>'+(!plan&&!R.pact.length?'<p class="sub">None.</p>':'')}
function renderCouncil(){if(!DOM)return;const st=CNTAB==='stars';if(!st&&R.phase==='plan')R.pactSeen=R.wave;$('cnT1').classList.toggle('on',st);$('cnT2').classList.toggle('on',!st);$('cnP').textContent=R.tp>0?R.tp:'';
  const box=$('cnBody');box.className=st?'stars':'';box.innerHTML=st?`<div class="sky">${starsSVG()}</div><div class="sinfo">${starInfo()}</div>`:pactsHTML();
  box.querySelectorAll('.sn').forEach(g=>g.addEventListener('click',()=>{CNSEL=g.dataset.id==='core'?null:g.dataset.id;renderCouncil()}));
  const tk=$('cnTake');if(tk)tk.addEventListener('click',()=>{if(starTake(CNSEL)){saveRun();uiRefresh();renderCouncil()}});
  box.querySelectorAll('.pact').forEach(b=>b.addEventListener('click',()=>{if(pactToggle(b.dataset.id)){sfx('click',.5);saveRun();uiRefresh();renderCouncil()}else if(R.pact.length>=2&&!R.pact.includes(b.dataset.id))toast('Two pacts at most')}));uiCouncil()}
// challenge runs, picked on the Play tab once a run has been won
function renderChall(){if(!DOM)return;const box=$('chBox');if(!box)return;box.hidden=!challOpen();if(box.hidden){CHSEL=null;return}const W=META.chw||{},C=CHSEL&&CHALL[CHSEL];
  box.innerHTML=`<div class="chrow"><button type="button" class="chip${CHSEL?'':' on'}" data-id="">No challenge</button>${CHALLS.map(c=>`<button type="button" class="chip${CHSEL===c.id?' on':''}${W[c.id]?' won':''}" data-id="${c.id}">${c.n}</button>`).join('')}</div>`+(C?`<p class="chd"><b>${C.n}.</b> ${C.d} Played at normal difficulty.${W[C.id]?' <i>Won.</i>':''}</p>`:'');
  box.querySelectorAll('.chip').forEach(b=>b.addEventListener('click',()=>{CHSEL=b.dataset.id||null;renderChall()}))}
function bindCouncil(){if(!DOM||!$('cnB'))return;$('cnB').insertAdjacentHTML('afterbegin',icon('star'));$('cnB').addEventListener('click',()=>openCouncil());$('cnX').addEventListener('click',()=>{$('ovCn').hidden=true});
  $('cnT1').addEventListener('click',()=>{CNTAB='stars';renderCouncil()});$('cnT2').addEventListener('click',()=>{CNTAB='pacts';CNSEL=null;renderCouncil()})}
