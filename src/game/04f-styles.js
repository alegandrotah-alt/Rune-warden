// ---------- attack styles and paths ----------
// Every hero's basic attack has a shape (a single strike, a cleaving swipe, an aura that pulses around it,
// a shove that knocks monsters back, a lobbed shell, a chaining bolt, a beam that heats up, a bolt that
// pierces a line). At ★2 the hero takes one of two paths for that shape, like a Bloons tower's upgrade path.
// Reach decides two more traits: close-range heroes (Vanguard) and long-range heroes (Artillery).
const STYLE={
  strike:{n:'Strike',ic:'sword',d:'Hits one monster in reach.',p:[{n:'Flurry',d:'attacks 40% faster.'},{n:'Crusher',d:'hits 60% harder but 15% slower, and knocks the monster back a little.'}]},
  shot:{n:'Shot',ic:'bow',d:'Fires at one monster.',p:[{n:'Rapid fire',d:'attacks 40% faster.'},{n:'Heavy shot',d:'hits 60% harder but 15% slower; shots knock back a little.'}]},
  swipe:{n:'Swipe',ic:'scythe',d:'Cleaves every monster in an arc in front of it; the others take 50%.',p:[{n:'Whirlwind',d:'spins all the way round, and the others take 65%.'},{n:'Rend',d:'every monster it cuts bleeds: 2 poison stacks.'}]},
  aura:{n:'Aura',ic:'eye',d:'Pulses around itself: every monster in reach takes 40% damage. Reach is at most 1.8 hexes.',p:[{n:'Searing aura',d:'reach grows by 0.75 hex and pulses deal 50%.'},{n:'Frost aura',d:'pulses slow monsters by 35% for 1s.'}]},
  push:{n:'Shove',ic:'fist',d:'Hits one monster and knocks it half a hex back down the road.',p:[{n:'Shockwave',d:'knocks back everything in a short cone in front of it.'},{n:'Stagger',d:'knocks back further and stuns for 0.4s.'}]},
  lob:{n:'Lob',ic:'boulder',d:'Lobs a shell over everything that bursts on the road, hurting every monster within 0.8 hex. 20% slower.',p:[{n:'Cluster shell',d:'splits into three bursts around the target.'},{n:'Quake shell',d:'a wider burst that slows monsters by 30% for 1.5s.'}]},
  chain:{n:'Chain',ic:'flame',d:'Its bolt jumps on to 2 more monsters for 60%.',p:[{n:'Storm',d:'jumps on to 5 more monsters.'},{n:'Overload',d:'jumps lose no damage.'}]},
  beam:{n:'Beam',ic:'star',d:'A beam that burns hotter while it stays on one monster: +15% per hit, up to +150%.',p:[{n:'Focus',d:'heats twice as fast, up to +250%.'},{n:'Prism',d:'a second beam hits another monster for 70%.'}]},
  pierce:{n:'Piercing bolt',ic:'arrow',d:'Its bolt flies through up to 3 monsters in a line.',p:[{n:'Lance',d:'flies through every monster in its line, and +1 range.'},{n:'Barbed',d:'every monster it hits takes 2 poison stacks.'}]},
};
const ATK={squire:'push',cutpurse:'strike',berserker:'swipe',paladin:'aura',ninja:'strike',werewolf:'swipe',blackknight:'swipe',vampire:'aura',duelist:'strike',plague:'aura',warlord:'swipe',destrier:'push',fenrir:'swipe',wolf:'strike',husky:'push',stag:'push',orcraider:'swipe',bull:'push',venom:'strike',breaker:'push',
  archer:'shot',apprentice:'shot',tinker:'pierce',hexwitch:'chain',scout:'shot',nightblade:'pierce',druid:'lob',tiefling:'lob',templar:'beam',wyrm:'beam',alchemist:'lob',bogwitch:'chain',frostmage:'pierce',necromancer:'chain',alpaca:'shot',doe:'aura',fox:'chain',bombard:'lob',bastion:'pierce',thorn:'aura',storm:'chain',hunt:'shot',archmage:'beam'};
const styleOf=k=>ATK[k]||(HEROES[k].proj==='melee'||HEROES[k].proj==='claw'?'strike':'shot');
const AURAR=1.8;
// Vanguard: everything that fights up close (strikes, swipes, shoves, auras); Artillery: everything that hits from 2.75 hexes or more
function reachOf(k){const st=styleOf(k);if(st==='strike'||st==='swipe'||st==='push'||st==='aura')return'vanguard';return HEROES[k].rng>=2.75?'artillery':null}
function pathPick(h,i){if(!h||h.star<2||h.path!=null||(i!==0&&i!==1))return false;h.path=i;if(typeof fx==='function'&&h.c>=0)fx({k:'ring',x:heroPos(h).x,y:heroPos(h).y,r:T*.8,col:'#ffd76a',dur:.5});return true}
// heroes still waiting for a path when a fight starts take the first one
function pathAuto(){const L=allHeroes().filter(h=>h.star>=2&&h.path==null);for(const h of L)pathPick(h,0);if(L.length&&typeof toast==='function')toast(L.map(h=>`${HEROES[h.k].n}: ${STYLE[styleOf(h.k)].p[0].n}`).join(', ')+' (no path was chosen, so the first one was taken).')}
// stat changes from the style, the path and the reach traits; called from heroStats
function styleStats(h,s){const st=styleOf(h.k),P=h.path,rc=reachOf(h.k);
  if((st==='shot'||st==='strike')&&P===0)s.as*=1.4;if((st==='shot'||st==='strike')&&P===1){s.dmg*=1.6;s.as*=.85}
  if(st==='lob')s.as*=.8;if(st==='pierce'&&P===0)s.rng+=1;
  if(rc==='vanguard'&&tier('vanguard')>=0)s.dmg*=1+[.1,.2,.35][tier('vanguard')];
  if(rc==='artillery'&&tier('artillery')>=0){s.dmg*=1+[.08,.16,.3][tier('artillery')];s.rng+=[.25,.5,1][tier('artillery')]}
  if(st==='aura')s.rng=Math.min(s.rng,AURAR)+(P===0?.75:0)}
const slowM=(m,p,t)=>{if(frenzy())return;m.slowT=Math.max(m.slowT,t);m.slowP=Math.min(m.slowP,p)};
// the basic attack, by style; strike() is the hero's plain hit or shot
function styleAttack(h,s,p,best,dmg,crit,strike){const st=styleOf(h.k),P=h.path,B=R.b,rr=s.rng*T+T*.3,D=HEROES[h.k],melee=D.proj==='melee'||D.proj==='claw';
  const near=(x,y,r)=>B.mons.filter(m=>m.hp>0&&targetable(m)&&canHit(h,m)&&Math.hypot(m.x-x,m.y-y)<r);
  const vg=tier('vanguard')>=2&&reachOf(h.k)==='vanguard',ar=tier('artillery')>=2&&reachOf(h.k)==='artillery';
  // Vanguard 6 and Artillery 6: every attack also bursts around the monster it hits
  const burst=(m)=>{if(!vg&&!ar)return;for(const o of near(m.x,m.y,T*(vg?.7:.6)))if(o!==m)hit(o,dmg*(vg?.3:.25),h,{})};
  const ang=Math.atan2(best.y-p.y,best.x-p.x),inArc=(m,w)=>{let d=Math.atan2(m.y-p.y,m.x-p.x)-ang;while(d>Math.PI)d-=6.283;while(d<-Math.PI)d+=6.283;return Math.abs(d)<=w};
  if(st==='strike'||st==='shot'){strike(best);if(P===1&&best.hp>0)knock(best,.2);burst(best)}
  else if(st==='swipe'){for(const m of near(p.x,p.y,rr)){if(m!==best&&P!==0&&!inArc(m,1.05))continue;hit(m,dmg*(m===best?1:P===0?.65:.5),h,{crit:crit&&m===best});if(P===1&&m.hp>0)poison(m,h,2,s)}
    fx({k:'swipe',x:p.x,y:p.y,a:ang,r:rr,full:P===0,dur:.22,col:D.proj==='claw'?'#ff8aa6':'#ffffff'});burst(best)}
  else if(st==='aura'){for(const m of near(p.x,p.y,rr)){hit(m,dmg*(P===0?.5:.4),h,{crit});if(P===1)slowM(m,.65,1)}
    fx({k:'ring',x:p.x,y:p.y,r:rr,col:P===1?'#a8e0ff':D.dt==='m'?'#d6a8ff':'#ffcf8a',dur:.35});burst(best)}
  else if(st==='push'){hit(best,dmg,h,{crit});const kb=P===1?.8:.5;knock(best,kb);if(P===1&&!frenzy()&&!affd(best,'jugg'))best.stunT=Math.max(best.stunT,best.boss?.15:.4);
    if(P===0)for(const m of near(p.x,p.y,T*1.3+T*.3))if(m!==best&&inArc(m,.6)){hit(m,dmg*.5,h,{});knock(m,.5)}
    fx({k:'slash',x:best.x,y:best.y,dur:.2,col:'#ffe0a0',face:h.face,big:1});fx({k:'ring',x:best.x,y:best.y,r:T*.45,col:'#ffe0a0',dur:.25});burst(best)}
  else if(st==='lob'){const tx=best.x+(best.kb?0:(best.vx||0)*.3),ty=best.y,mk=(x,y,a,k)=>{B.projs.push({x:p.x,y:p.y-T*.25,tg:null,tx:x,ty:y,dmg:dmg*k,src:h,crit,kind:D.proj,mult:1,mask:0,sp:T*5.5,c:-2,r:-2,aoe:a,lob:1,d0:Math.max(T,Math.hypot(x-p.x,y-p.y)),slow:P===1})};
    if(P===0){mk(tx,ty,T*.65,.85);for(let i=0;i<2;i++){const a=ang+(i?1:-1)*1.6;mk(tx+Math.cos(a)*T*.55,ty+Math.sin(a)*T*.55,T*.55,.6)}}else mk(tx,ty,T*(P===1?1.15:.8),1)}
  else if(st==='chain'){strike(best);let cur=best,done=new Set([best]),k=P===1?1:.6;for(let i=0;i<(P===0?5:2);i++){const nx=near(cur.x,cur.y,T*1.7).filter(m=>!done.has(m)).sort((a,b)=>Math.hypot(a.x-cur.x,a.y-cur.y)-Math.hypot(b.x-cur.x,b.y-cur.y))[0];if(!nx)break;
      hit(nx,dmg*k,h,{chainHit:1});fx({k:'bolt',x:cur.x,y:cur.y,x1:nx.x,y1:nx.y,dur:.2,col:'#9ad8ff'});done.add(nx);cur=nx}burst(best)}
  else if(st==='beam'){const bt=B.bt||(B.bt=new Map());if(bt.get(h)!==best){bt.set(h,best);h.heat=0}else h.heat=Math.min(P===0?2.5:1.5,(h.heat||0)+(P===0?.3:.15));hit(best,dmg*(1+h.heat),h,{crit});
    fx({k:'line',x:p.x,y:p.y,x1:best.x,y1:best.y,dur:.16,col:h.heat>1?'#ffffff':h.heat>.5?'#ffd27a':'#ff9a5a'});
    if(P===1){const o=near(p.x,p.y,rr).filter(m=>m!==best).sort((a,b)=>progress(a)-progress(b))[0];if(o){hit(o,dmg*.7,h,{});fx({k:'line',x:p.x,y:p.y,x1:o.x,y1:o.y,dur:.16,col:'#c8a8ff'})}}burst(best)}
  else if(st==='pierce'){const ux=Math.cos(ang),uy=Math.sin(ang),L=rr+T*.5,max=P===0?99:3;const on=near(p.x,p.y,L+T).map(m=>{const t=(m.x-p.x)*ux+(m.y-p.y)*uy,d=Math.abs((m.y-p.y)*ux-(m.x-p.x)*uy);return{m,t,d}}).filter(o=>o.t>0&&o.t<L&&o.d<T*.38).sort((a,b)=>a.t-b.t).slice(0,max);
    if(!on.some(o=>o.m===best))on.unshift({m:best,t:0});for(const o of on){hit(o.m,dmg,h,{crit:crit&&o.m===best});if(P===1&&o.m.hp>0)poison(o.m,h,2,s)}
    fx({k:'line',x:p.x,y:p.y,x1:p.x+ux*L,y1:p.y+uy*L,dur:.18,col:D.proj==='ice'?'#bfe8ff':'#fff2c8'});burst(best)}
  if(melee||st==='aura')sfx('hit',.18,1.1+Math.random()*.3)}

// ---------- monsters that counter attack shapes (Bloons-style properties) ----------
// Flying: ground attacks (strikes, swipes, shoves and lobbed shells) cannot reach it.
// Plated: shots, piercing bolts and chain bolts do only 30% (spells and everything else hit normally).
// Veiled: heroes see it only from 2 hexes away, until an aura, a chain or a spell hits it (revealed for 3s).
const GROUND={strike:1,swipe:1,push:1,lob:1},PIERCERS={shot:1,pierce:1,chain:1},REVEAL={aura:1,chain:1};
for(const k of ['golem','orcskull','goleling','spiky','brute','maw','colossus'])if(MON[k])MON[k].plate=1;
for(const k of ['srogue','tribal','frog','frostorc','dino','shade'])if(MON[k])MON[k].veil=1;
const canHit=(h,m)=>!(m.fly&&GROUND[styleOf(h.k)]);
const canSee=(h,m,d)=>!(m.veil&&!(m.revT>0)&&d>T*2);
// what a basic attack loses or gains against the monster's properties
function propMul(m,src,opt){if(!src||!HEROES[src.k])return 1;const st=styleOf(src.k);if(!opt.spell&&m.plate&&PIERCERS[st])return .3;return 1}
function propReveal(m,src,opt){if(m.veil&&(opt.spell||src&&HEROES[src.k]&&REVEAL[styleOf(src.k)]))m.revT=3}
