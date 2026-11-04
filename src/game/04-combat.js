// ---------- waves, monsters, heroes, projectiles, spells ----------
// Monster health grows steeply wave after wave, just like Gate Rush keeps; your answer is stars, traits, relics and × runes.
const hpBase=w=>24*Math.pow(1.19,w-1)*(w>30?Math.pow(1.07,Math.pow(w-30,1.25)):1);
const actOf=w=>Math.min(2,Math.floor((w-1)/10));
function waveList(w){
  const A=ACTS[actOf(w)],n=Math.min(46,6+Math.round(w*.95)),out=[];const wi=((w-1)%10)+1;
  if(wi===10&&w<=30){out.push({k:A.boss});for(let i=0;i<Math.round(n*.5);i++)out.push({k:rnd(A.roster)});return out}
  const pool=A.roster.slice(0,Math.min(A.roster.length,1+Math.ceil(wi/2)));
  for(let i=0;i<n;i++)out.push({k:rnd(pool)});
  if(wi%3===0)for(let i=0;i<1+Math.floor(w/12);i++)out.splice((Math.random()*out.length)|0,0,{k:A.big});
  if(wi===5||wi===8||w>30&&w%3===0){const e=out[(Math.random()*out.length)|0];e.elite=1}
  if(w>30){for(const e of out)if(Math.random()<.3)e.k=rnd(ACTS[(Math.random()*3)|0].roster)}
  return out}
function startWave(){
  if(R.phase!=='plan'||!R.board.length&&!R.bench.some(Boolean))return false;
  R.phase='wave';R.b={mons:[],projs:[],fx:[],traps:[],q:(R.nextQ&&R.nextQ.length?R.nextQ:waveList(R.wave)).map(e=>Object.assign({},e)),qT:.3,t:0,leaked:0,kills:0,big:0};
  for(const h of R.board){h.mana=0;h.cd=Math.random()*.4;h.hits=0;h.buffT=0;h.wd=0}
  calcTraits();if(R.wave%10===0&&R.wave<=30){sfx('elite',.8);banner(MON[ACTS[actOf(R.wave)].boss].n.toUpperCase(),'#ff6a5a')}else sfx('ready',.5);
  return true}
function spawnMon(k,elite,x,y,hpFrac){
  const D=MON[k],B=R.b,hp=D.hp*hpBase(R.wave)*(elite?6:1)*(R.wave>30&&D.boss?3:1);
  const row=rnd(SPAWN_ROWS.filter(r=>R.field.dist&&R.field.dist[r*COLS]>=0));
  const m={id:UID++,k,x:x??-T*.6,y:y??(row+.5)*T+(Math.random()-.5)*T*.4,max:hp,hp:hp*(hpFrac||1),sp:D.sp*(elite?.85:1),ar:D.ar,mr:D.mr,w:D.w*(elite?3:1),fly:!!D.fly,boss:!!D.boss,big:!!D.big,elite:!!elite,
    slowT:0,slowP:1,stunT:0,rootT:0,dots:[],portals:0,bounty:elite?3:0,face:1,wob:Math.random()*6,sumT:3,healT:2,c:-1,r:-1,hitT:0};
  B.mons.push(m);return m}
const monAlive=()=>R.b?R.b.mons.filter(m=>m.hp>0):[];
// how far along the road a monster is: lower = closer to the keep
function progress(m){if(m.fly)return FW-m.x;if(m.x<0)return 999+(-m.x);const c=clamp((m.x/T)|0,0,COLS-1),r=clamp((m.y/T)|0,0,ROWS-1),d=R.field.dist?R.field.dist[r*COLS+c]:0;return d<0?500:d*T}
function monTick(m,dt){
  const B=R.b;m.wob+=dt*6;if(m.hitT>0)m.hitT-=dt;
  // damage over time
  if(m.dots.length){for(const o of m.dots){const d=o.dps*Math.min(dt,o.t);o.t-=dt;if(d>0&&m.hp>0)dealRaw(m,d,o.src,1)}m.dots=m.dots.filter(o=>o.t>0)}
  if(m.hp<=0)return;
  if(m.stunT>0){m.stunT-=dt;return}if(m.rootT>0){m.rootT-=dt;return}
  if(m.slowT>0)m.slowT-=dt;else m.slowP=1;
  let sp=m.sp*T*m.slowP*(has('mire')?.9:1);
  if(tier('guardian')>=0&&!m.fly)for(const h of R.board){if(!HEROES[h.k].tr.includes('guardian'))continue;const hx=(h.c+.5)*T,hy=(h.r+.5)*T;if(Math.abs(hx-m.x)<T*1.5&&Math.abs(hy-m.y)<T*1.5){sp*=1-[.2,.4][tier('guardian')];break}}
  let tx,ty;
  if(m.fly){tx=FW+T;ty=FH/2}
  else{const c=Math.floor(m.x/T),r=clamp(Math.floor(m.y/T),0,ROWS-1);
    if(c<0){tx=T*.5;ty=clamp(m.y,T*.5,FH-T*.5);if(R.field.dist[r*COLS]<0){const rr=SPAWN_ROWS.find(q=>R.field.dist[q*COLS]>=0);ty=(rr+.5)*T}}
    else if(c>=COLS){tx=m.x+T;ty=m.y}
    else{if(c!==m.c||r!==m.r){m.c=c;m.r=r;const p=portalAt(c,r),pi=p?R.field.portals.indexOf(p):-1;if(p&&!(m.portals>>pi&1)&&!m.boss)portalSplit(m,p,pi)}
      const d=R.field.dist[r*COLS+c];if(d===0){tx=FW+T;ty=(r+.5)*T}else{const n=nextCell(c,r);if(n){tx=(n[0]+.5)*T;ty=(n[1]+.5)*T}else{tx=FW+T;ty=m.y}}}}
  const dx=tx-m.x,dy=ty-m.y,dd=Math.hypot(dx,dy)||1;m.x+=dx/dd*sp*dt;m.y+=dy/dd*sp*dt;if(Math.abs(dx)>2)m.face=dx>0?1:-1;
  // traps
  for(const tp of B.traps){if(tp.uses>0&&!m.fly&&Math.hypot(tp.x-m.x,tp.y-m.y)<T*.45&&!tp.hit.has(m.id)){tp.hit.add(m.id);tp.uses--;m.rootT=Math.max(m.rootT,tp.root);dealRaw(m,tp.dmg*(1-m.ar),tp.src,0);fx({k:'ring',x:m.x,y:m.y,r:T*.5,col:'#9aff6a',dur:.35})}}
  // specials
  const D=MON[m.k];
  if(D.heal){m.healT-=dt;if(m.healT<=0){m.healT=3;for(const o of B.mons)if(o!==m&&o.hp>0&&Math.hypot(o.x-m.x,o.y-m.y)<T*1.6){o.hp=Math.min(o.max,o.hp+o.max*.15)}fx({k:'ring',x:m.x,y:m.y,r:T*1.6,col:'#7dff9a',dur:.5})}}
  if(D.summon){m.sumT-=dt;if(m.sumT<=0){m.sumT=4.5;for(let i=0;i<2;i++){const s=spawnMon(D.summon,0,m.x+(Math.random()-.5)*T*.6,m.y+(Math.random()-.5)*T*.6);s.c=m.c;s.r=m.r;s.portals=-1}fx({k:'ring',x:m.x,y:m.y,r:T,col:'#c07aff',dur:.5})}}
  if(m.x>FW+T*.35){leak(m)}
}
function portalSplit(m,p,pi){
  m.portals|=1<<pi;const v=portalMul(p),bv=.35*(has('baron')?2:1)*(has('riftlord')?3:1);m.bounty+=bv;
  for(let i=1;i<v;i++){const c=spawnMon(m.k,m.elite,m.x+(Math.random()-.5)*T*.5,m.y+(Math.random()-.5)*T*.5,m.hp/m.max);c.portals=m.portals;c.bounty=m.bounty;c.c=m.c;c.r=m.r}
  p.flash=.4;fx({k:'ring',x:(p.c+.5)*T,y:(p.r+.5)*T,r:T*.7,col:'#c07aff',dur:.4});if(Math.random()<.4)sfx('zap',.25,1.3)}
function leak(m){m.hp=0;m.dead=1;R.hp-=m.w;R.b.leaked+=m.w;R.stats.leaks+=m.w;R.leakAct+=m.w;shake(m.boss?14:5);sfx('lost',.5);floatText(FW+T*.2,m.y,'-'+m.w,'#ff5a5a',1)}
// ---------- damage ----------
function hit(m,amt,src,opt){
  if(m.hp<=0)return 0;opt=opt||{};const D=src?HEROES[src.k]:null,tr=D?D.tr:[];
  if(src&&tr.includes('shadow')&&tier('shadow')>=0&&m.hp<m.max/2)amt*=1+[.25,.6,1.1][tier('shadow')];
  if(src&&tr.includes('wildwood')&&tier('wildwood')>=0){m.slowT=1.5;m.slowP=Math.min(m.slowP,1-[.15,.25,.35][tier('wildwood')])}
  if(src&&!opt.spell&&tr.includes('guardian')&&tier('guardian')>=0){src.hits++;if(src.hits%3===0)m.stunT=Math.max(m.stunT,[.4,.8][tier('guardian')])}
  const red=(opt.dt||(D&&D.dt))==='m'?m.mr:m.ar;amt*=1-red;
  return dealRaw(m,amt,src,0,opt)}
function dealRaw(m,amt,src,dot,opt){
  if(m.hp<=0||!(amt>0))return 0;const d=Math.min(m.hp,amt);if(src)src.wd=(src.wd||0)+d;m.hp-=amt;R.stats.dmg+=d;m.hitT=.12;
  if(!dot&&SET.nums&&TXT.length<18&&(opt&&(opt.crit||opt.mult>1)||opt&&opt.big&&Math.random()<.5||Math.random()<.06))floatText(m.x,m.y-T*.6,fmt(amt),opt&&opt.crit?'#ffd76a':opt&&opt.mult>1?'#c9a8ff':'#ffffff',opt&&opt.crit||opt&&opt.mult>1?1.15:.85);
  if(m.hp>0&&has('reaper')&&!m.boss&&m.hp<m.max*.12)m.hp=0;
  if(m.hp<=0&&!m.dead)kill(m,src,opt);return d}
function kill(m,src,opt){
  m.dead=1;R.stats.kills++;R.b.kills++;META.kills=(META.kills||0)+1;
  let g=m.bounty+(m.boss?12:0);if(opt&&opt.gold)g+=1;if(m.portals>0)R.portalGold+=m.bounty;if(R.portalGold>=50)award('portal50');
  if(g>0){R.goldFrac+=g;const w=Math.floor(R.goldFrac);if(w>0){R.goldFrac-=w;R.gold+=w;floatText(m.x,m.y-T*.9,'+'+w+'g','#ffcf2e',1);sfx('coin',.35,1+Math.random()*.2)}}
  if(m.boss){R.stones.push(2);banner('BOSS DEFEATED','#ffd76a');shake(16);sfx('boomBig',.8)}
  const D=MON[m.k];if(D.split&&!m.child)for(let i=0;i<D.split;i++){const c=spawnMon(m.k,0,m.x+(i?8:-8),m.y+(i?6:-6));c.max=m.max*.4;c.hp=c.max;c.child=1;c.portals=m.portals;c.bounty=0;c.c=m.c;c.r=m.r;c.sz=.65}
  fx({k:'corpse',x:m.x,y:m.y,mk:m.k,face:m.face,sz:m.sz||MON[m.k].sz,fly:m.fly,boss:m.boss,dur:m.boss?1.2:.5});
  fx({k:'die',x:m.x,y:m.y,dur:.45,col:m.boss?'#ffcf6a':'#d8d0c0',r:T*(MON[m.k].sz||1)*.6});
  if(m.boss||m.elite||m.big)sfx('crunch',.45,.9+Math.random()*.2);
}
// ---------- heroes ----------
function heroPos(h){return{x:(h.c+.5)*T,y:(h.r+.5)*T}}
function heroTick(h,dt){
  const D=HEROES[h.k],s=heroStats(h),p=heroPos(h),B=R.b;
  if(h.atk>0)h.atk-=dt;if(h.buffT>0)h.buffT-=dt;h.cd-=dt;
  const regen=tier('sorcerer')>=0?[2,5,10][tier('sorcerer')]:0;h.mana+=regen*dt*(has('arcana')?1.5:1);
  if(h.cd>0)return;
  const rr=s.rng*T;let best=null,bp=1e9;for(const m of B.mons){if(m.hp<=0)continue;const d=Math.hypot(m.x-p.x,(m.y-p.y));if(d>rr+T*.3)continue;const pr=progress(m);if(pr<bp){bp=pr;best=m}}
  if(!best)return;
  h.cd=1/s.as;h.atk=.42;h.face=best.x>=p.x?1:-1;
  h.mana+=10*(has('arcana')?1.5:1);
  if(h.mana>=D.mana){h.mana=0;cast(h,s,best);if(has('echo')&&Math.random()<.35)setTimeoutSafe(()=>{if(R&&R.b&&R.board.includes(h))cast(h,heroStats(h),best.hp>0?best:monAlive()[0]||best)},250);return}
  const crit=Math.random()<s.crit,dmg=s.dmg*(crit?s.cm:1);
  if(D.proj==='melee'||D.proj==='claw'){hit(best,dmg,h,{crit});fx({k:'slash',x:best.x,y:best.y,dur:.18,col:D.proj==='claw'?'#ff6a8a':'#ffffff',face:h.face});sfx('hit',.18,1.1+Math.random()*.3)}
  else shoot(h,p,best,dmg,{crit,kind:D.proj});
}
function shoot(h,p,m,dmg,o){R.b.projs.push({x:p.x,y:p.y-T*.25,tg:m,tx:m.x,ty:m.y,dmg,src:h,crit:o.crit,kind:o.kind,mult:1,mask:0,sp:o.sp||T*9,c:(p.x/T)|0,r:(p.y/T)|0,spell:o.spell,aoe:o.aoe||0,fxk:o.fxk});if(o.kind==='arrow'||o.kind==='bolt')sfx('rail',.12,1.6+Math.random()*.3)}
function projTick(q,dt){
  if(q.tg&&q.tg.hp>0){q.tx=q.tg.x;q.ty=q.tg.y-T*.15}
  const dx=q.tx-q.x,dy=q.ty-q.y,d=Math.hypot(dx,dy),step=q.sp*dt;
  if(d<=step+4){q.x=q.tx;q.y=q.ty;q.done=1;
    const o={crit:q.crit,mult:q.mult,spell:q.spell,big:q.mult>1};
    if(q.aoe){for(const m of R.b.mons)if(m.hp>0&&Math.hypot(m.x-q.x,m.y-q.y)<q.aoe)hit(m,q.dmg*q.mult,q.src,o);fx({k:'ring',x:q.x,y:q.y,r:q.aoe,col:'#ffb060',dur:.3})}
    else if(q.tg&&q.tg.hp>0)hit(q.tg,q.dmg*q.mult,q.src,o);
    if(q.mult>=9)award('rune9');return}
  q.x+=dx/d*step;q.y+=dy/d*step;
  // crossing a rune tile multiplies the shot, once per rune
  const c=Math.floor(q.x/T),r=Math.floor(q.y/T);if(c!==q.c||r!==q.r){q.c=c;q.r=r;const ru=c>=0&&r>=0&&c<COLS&&r<ROWS?runeAt(c,r):null;if(ru){const i=R.field.runes.indexOf(ru);if(!(q.mask>>i&1)){q.mask|=1<<i;q.mult*=runeMul(ru);ru.flash=.25}}}
}
// runes a straight line crosses (for lines and beams)
function lineMult(x0,y0,x1,y1){let m=1,mask=0;const n=Math.ceil(Math.hypot(x1-x0,y1-y0)/(T/4));for(let i=0;i<=n;i++){const x=lerp(x0,x1,i/n),y=lerp(y0,y1,i/n),c=Math.floor(x/T),r=Math.floor(y/T);if(c<0||r<0||c>=COLS||r>=ROWS)continue;const ru=runeAt(c,r);if(ru){const k=R.field.runes.indexOf(ru);if(!(mask>>k&1)){mask|=1<<k;m*=runeMul(ru);ru.flash=.3}}}return m}
function cast(h,s,tg){
  const D=HEROES[h.k],A=D.ab,p=heroPos(h),B=R.b,pw=s.dmg*A.m*s.spell,o={spell:1,dt:D.dt,big:1};
  h.atk=.6;fx({k:'cast',x:p.x,y:p.y,dur:.5,col:TRAITS[D.tr[1]].col});if(TXT.filter(t=>t.cast).length<3){floatText(p.x,p.y-T*.75,D.ab.n+'!',TRAITS[D.tr[1]].col,.9);TXT[TXT.length-1].cast=1}sfx('zap',.3,.9+Math.random()*.2);
  const inR=(x,y,r)=>B.mons.filter(m=>m.hp>0&&Math.hypot(m.x-x,m.y-y)<r);
  if(A.k==='nova'){const cx=A.self?p.x:tg.x,cy=A.self?p.y:tg.y,r=A.r*T;
    for(const m of inR(cx,cy,r)){if(A.m>0)hit(m,A.dot?pw*.3:pw,h,o);if(A.stun)m.stunT=Math.max(m.stunT,A.stun);if(A.root)m.rootT=Math.max(m.rootT,A.root);if(A.burn)m.dots.push({dps:pw*.5/3*(1-m.mr),t:3,src:h});if(A.dot)m.dots.push({dps:s.dmg*A.dot*s.spell/4*(1-m.mr),t:4,src:h})}
    if(A.heal){R.hp=Math.min(R.hpMax,R.hp+A.heal);floatText(FW+T*.2,FH/2-T,'+'+A.heal,'#7dff9a',1)}
    fx({k:A.root?'roots':A.burn?'fire':A.dot?'hex':'nova',x:cx,y:cy,r,dur:.55,col:TRAITS[D.tr[1]].col});shake(2)}
  else if(A.k==='fan'){const ts=B.mons.filter(m=>m.hp>0&&Math.hypot(m.x-p.x,m.y-p.y)<s.rng*T+T*.3).sort((a,b)=>progress(a)-progress(b));for(let i=0;i<A.shots;i++){const m=ts[i%Math.max(1,ts.length)]||tg;shoot(h,p,m,s.dmg*A.m*s.spell,{kind:D.proj==='melee'?'star':D.proj,spell:1,crit:Math.random()<s.crit})}}
  else if(A.k==='execute'){const ts=inR(p.x,p.y,s.rng*T+T*.3);const m=A.strong?ts.sort((a,b)=>b.hp-a.hp)[0]:ts.sort((a,b)=>a.hp-b.hp)[0];if(m){hit(m,pw,h,{spell:1,dt:D.dt,big:1,gold:A.gold,crit:1});fx({k:'slash',x:m.x,y:m.y,dur:.3,col:'#ff4a6a',face:h.face,big:1});shake(3)}}
  else if(A.k==='pierce'){const a=Math.atan2(tg.y-p.y,tg.x-p.x),L=s.rng*T*1.7,x1=p.x+Math.cos(a)*L,y1=p.y+Math.sin(a)*L,mm=lineMult(p.x,p.y,x1,y1);
    for(const m of B.mons){if(m.hp<=0)continue;const t=clamp(((m.x-p.x)*Math.cos(a)+(m.y-p.y)*Math.sin(a))/L,0,1),qx=p.x+Math.cos(a)*L*t,qy=p.y+Math.sin(a)*L*t;if(Math.hypot(m.x-qx,m.y-qy)<T*.4)hit(m,pw*mm,h,{spell:1,dt:D.dt,mult:mm,big:1})}
    fx({k:'line',x:p.x,y:p.y,x1,y1,dur:.3,col:'#ffd76a',mult:mm})}
  else if(A.k==='chain'){let cur=tg,done=new Set(),from=p;for(let i=0;i<A.n2&&cur;i++){done.add(cur);hit(cur,pw,h,o);fx({k:'bolt',x:from.x,y:from.y,x1:cur.x,y1:cur.y,dur:.25,col:'#c9a8ff'});from={x:cur.x,y:cur.y};let nb=null,nd=T*2.5;for(const m of B.mons){if(m.hp<=0||done.has(m))continue;const d=Math.hypot(m.x-cur.x,m.y-cur.y);if(d<nd){nd=d;nb=m}}cur=nb}}
  else if(A.k==='trap'){let tx=tg.x,ty=tg.y;if(!tg.fly&&tg.c>=0&&tg.c<COLS){const n=nextCell(tg.c,tg.r);if(n){tx=(n[0]+.5)*T;ty=(n[1]+.5)*T}}B.traps.push({x:tx,y:ty,root:A.root,dmg:pw,uses:3,t:9,src:h,hit:new Set()});shoot(h,p,tg,s.dmg,{kind:'bolt'})}
  else if(A.k==='buff'){h.buffT=A.t;h.buffAs=A.as;fx({k:'nova',x:p.x,y:p.y,r:T*.8,dur:.4,col:'#ff6a8a'})}
  else if(A.k==='beam'){const y=tg.y,mm=lineMult(0,y,FW,y);for(const m of B.mons)if(m.hp>0&&Math.abs(m.y-y)<T*.55)hit(m,pw*mm,h,{spell:1,dt:D.dt,mult:mm,big:1});fx({k:'beam',x:0,y,x1:FW,y1:y,dur:.5,col:'#ffe9a0',mult:mm});shake(5)}
  else if(A.k==='cone'){const a=Math.atan2(tg.y-p.y,tg.x-p.x),r=A.r*T;for(const m of B.mons){if(m.hp<=0)continue;const dx=m.x-p.x,dy=m.y-p.y,d=Math.hypot(dx,dy);if(d>r)continue;let da=Math.atan2(dy,dx)-a;da=Math.atan2(Math.sin(da),Math.cos(da));if(Math.abs(da)<.65){hit(m,pw,h,o);if(A.burn)m.dots.push({dps:pw*.4/3*(1-m.mr),t:3,src:h})}}fx({k:'cone',x:p.x,y:p.y,a,r,dur:.5,col:'#ff7a2a'});shake(3)}
}
// echoes run on the game clock so they respect pause and speed
const LATER=[];function setTimeoutSafe(f,ms){LATER.push({f,t:ms/1000})}
function battleTick(dt){
  const B=R.b;B.t+=dt;
  if(B.q.length){B.qT-=dt;if(B.qT<=0){const e=B.q.shift();spawnMon(e.k,e.elite);B.qT=Math.max(.32,.75-.012*R.wave)*(MON[e.k].boss?2.5:1)}}
  for(const m of B.mons)if(m.hp>0)monTick(m,dt);
  for(const h of R.board)heroTick(h,dt);
  for(const q of B.projs)projTick(q,dt);B.projs=B.projs.filter(q=>!q.done);
  for(const tp of B.traps)tp.t-=dt;B.traps=B.traps.filter(tp=>tp.t>0&&tp.uses>0);
  for(const l of LATER)l.t-=dt;const due=LATER.filter(l=>l.t<=0);for(const l of due){LATER.splice(LATER.indexOf(l),1);l.f()}
  B.mons=B.mons.filter(m=>m.hp>0);
  if(R.hp<=0){R.hp=0;runOver(false);return}
  if(!B.q.length&&!B.mons.length)endWave();
}
