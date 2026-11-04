// ---------- waves, monsters, heroes, projectiles, spells ----------
// Monster health grows steeply wave after wave, just like Gate Rush keeps; your answer is stars, traits, items, relics and × runes.
// steep through act I, a little gentler after, so hero power (stars, items, runes) can keep up; endless gets brutal again
const hpBase=w=>24*Math.pow(1.19,Math.min(w,10)-1)*Math.pow(HPG,Math.max(0,Math.min(w,30)-10))*(w>30?Math.pow(1.19,w-30)*Math.pow(1.07,Math.pow(w-30,1.25)):1);
let HPG=1.14;
// what a monster hit does to a hero: grows slower than monster health, so stars and items keep up
const mDmgBase=w=>14*Math.pow(1.105,w-1)*(w>30?Math.pow(1.04,w-30):1);
const actOf=w=>Math.min(2,Math.floor((w-1)/10));
function waveList(w){
  const A=actD(actOf(w)),n=Math.min(46,6+Math.round(w*.95)),out=[];const wi=((w-1)%10)+1;
  if(wi===10&&w<=30){out.push({k:A.boss});for(let i=0;i<Math.round(n*.5);i++)out.push({k:rndS(A.roster)});return tagGates(out,w)}
  const pool=A.roster.slice(0,Math.min(A.roster.length,1+Math.ceil(wi/2)));
  for(let i=0;i<n;i++)out.push({k:rndS(pool)});
  if(wi%3===0)for(let i=0;i<1+Math.floor(w/12);i++)out.splice((rng()*out.length)|0,0,{k:A.big});
  if(wi===5||wi===8||w>30&&w%3===0){const e=out[(rng()*out.length)|0];e.elite=1}
  if(asc(2)&&w>=4){const e=out[(rng()*out.length)|0];e.elite=1}
  if(w>30){for(const e of out)if(rng()<.3)e.k=rndS(actD((rng()*3)|0).roster)}
  return tagGates(out,w)}
function startWave(){
  if(R.phase!=='plan'||!R.board.length&&!R.bench.some(Boolean))return false;
  if(R.map&&!R.map.next){const o=mapOptions();if(o.length&&!o.some(q=>isFight(q.t)))return false}
  mapEnter();
  R.phase='wave';R.b={mons:[],projs:[],fx:[],traps:[],zones:[],q:(R.nextQ&&R.nextQ.length?R.nextQ:waveList(R.wave)).map(e=>Object.assign({},e)),gs:null,qT:.3,t:0,leaked:0,kills:0,big:0,ko:0,drops:0};
  R.b.gs=R.b.q.map(e=>({g:e.g||0}));
  for(const h of R.board){const I=itemStats(h);h.mana=I.mana||0;h.cd=Math.random()*.4;h.hits=0;h.buffT=0;h.wd=0;h.stk=0;h.ac=0;h.ko=0;h.chillT=0;h.tauntT=0;h.hurtT=0;h.seizT=0;h.hpMax=heroMaxHp(h);h.hp=h.hpMax;if(R.hymn)h.mana=HEROES[h.k].mana}R.hymn=0;
  calcTraits();guardWave();if(R.final||R.wave%10===0&&R.wave<=30)sfx('elite',.8);else sfx('ready',.5);
  return true}
function spawnMon(k,elite,x,y,hpFrac,gi){
  const D=MON[k],B=R.b,hp=D.hp*hpBase(R.wave)*(elite?6:1)*(R.wave>30&&D.boss&&!D.final?3:1)*(asc(1)?1.15:1)*(asc(9)?1.15:1)*(D.boss&&asc(7)?1.35:1)*(has('philo')?1.2:1);
  const row=rnd(SPAWN_ROWS.filter(r=>R.field.dist&&R.field.dist[r*COLS]>=0)),G=x==null&&gi&&R.field.gates?R.field.gates[gi]:null,gc=G&&G.k!=='west'&&R.field.dist[G.r*COLS+G.c]>=0;
  const m={id:UID++,k,x:x??(gc?hx(G.c,G.r)+(Math.random()-.5)*T*.2:-T*.6),y:y??(gc?hy(G.r)+(Math.random()-.5)*T*.2:hy(row)+(Math.random()-.5)*T*.3),max:hp,hp:hp*(hpFrac||1),sp:D.sp*(elite?.85:1)*(asc(4)?1.08:1),ar:D.ar,mr:D.mr,w:D.w*(elite?3:1),fly:!!D.fly,boss:!!D.boss,big:!!D.big,elite:!!elite,
    slowT:0,slowP:1,stunT:0,rootT:0,dots:[],psn:null,portals:0,bounty:(elite?3:0)+(R.node==='treasure'?.5:0),face:1,wob:Math.random()*6,sumT:3,healT:2,c:-1,r:-1,hitT:0,atkT:.6+Math.random()};
  if(gc){m.c=G.c;m.r=G.r;m.gate=G.id;G.flash=.5;if(B.gfx!==B.t){B.gfx=B.t;fx({k:'ring',x:m.x,y:m.y,r:T*.6,col:'#c07aff',dur:.4})}}
  if(D.final){m.cap=1;m.capLeft=m.max*DEV.cap;m.capT=1;m.bodT=6;m.phase=0;m.beats=0}if(D.beh==='phase')m.phT=2+Math.random()*2;
  if(elite&&!x){m.aff=rnd(AFFKEYS);if(m.aff==='swift')m.sp*=1.4;if(m.aff==='shield')m.sh=m.max*.35}
  if(D.boss&&x==null&&!B.intro){B.intro={k,t:0,dur:2.6};shake(12);sfx('boomBig',.7,.7);fx({k:'ring',x:0,y:m.y,r:T*2.5,col:'#ff5a4a',dur:1})}
  B.mons.push(m);return m}
const monAlive=()=>R.b?R.b.mons.filter(m=>m.hp>0):[];
// how far along the road a monster is: lower = closer to the keep
function progress(m){if(m.fly)return FW-m.x;if(m.x<0)return 999+(-m.x);if(m.x>FW)return 0;const c=m.c>=0?m.c:0,r=m.r>=0?m.r:SPAWN_ROWS[0],d=R.field.dist?R.field.dist[r*COLS+c]:0;return d<0?500:d*T}
function monTick(m,dt){
  const B=R.b;m.wob+=dt*6;if(m.hitT>0)m.hitT-=dt;
  // damage over time
  if(m.dots.length){for(const o of m.dots){const d=o.dps*Math.min(dt,o.t);o.t-=dt;if(d>0&&m.hp>0)dealRaw(m,d,o.src,1)}m.dots=m.dots.filter(o=>o.t>0)}
  if(m.aff==='regen'&&m.hp<m.max)m.hp=Math.min(m.max,m.hp+m.max*.02*dt);
  if(m.psn){const p=m.psn;dealRaw(m,p.n*p.dps*Math.min(dt,p.t)*(tier('plague')>=1?2:1)*(1-m.mr*.5),p.src,1);p.t-=dt;if(p.t<=0)m.psn=null}
  if(m.hp<=0)return;
  const D=MON[m.k];
  if(D.final)finalTick(m,dt);
  else if(m.boss&&!m.rifted&&m.hp<m.max*.5&&R.wave<=30){m.rifted=1;openRift(1+R.act,R.act>=2?1:0);banner(D.n.toUpperCase()+' TEARS A BREACH','#d6a8ff')}
  if(D.beh==='phase'){m.phT-=dt;if(m.phT<=0){m.phased=!m.phased;m.phT=m.phased?1.2:3.5}}
  if(m.dreadT>0)m.dreadT-=dt;
  if(m.sleepT>0){m.sleepT-=dt;return}
  if(m.charmT>0){charmTick(m,dt);return}
  if(m.stunT>0){m.stunT-=dt;return}if(m.rootT>0){m.rootT-=dt;monAttack(m,dt);return}
  // zones of the frontline: melee heroes slow monsters near them; some auras do more
  const rush=D.beh==='rush';let zs=1;
  if(!m.fly)for(const f of B.fl){const d=Math.hypot(f.x-m.x,f.y-m.y);if(f.sanct&&d<T*2.1){dealRaw(m,m.max*(m.boss?.004:.03)*dt,f.h,1)}if(d>T*1.5)continue;if(!rush)zs=Math.min(zs,f.k==='thirst'?.75:.85);if(f.k==='dread')m.dreadT=.25}
  // hunters stop to fight a hero in reach; runners never stop
  // (after a long brawl they push on for a while, so a stalemate can't stop a wave)
  if(m.huntCd>0)m.huntCd-=dt;
  if(D.beh==='hunt'&&D.atk&&m.x>0&&!(m.huntCd>0)&&R.board.some(h=>heroUp(h)&&Math.hypot(hx(h.c,h.r)-m.x,hy(h.r)-m.y)<=D.atk.r*T)){m.huntT=(m.huntT||0)+dt;if(m.huntT>(m.boss?6:10)){m.huntT=0;m.huntCd=4}monAttack(m,dt);return}
  if(m.kb>0){kbTick(m,dt);return}
  if(m.slowT>0)m.slowT-=dt;else m.slowP=1;
  let sp=m.sp*T*(rush?Math.max(m.slowP,.75):m.slowP)*(has('mire')?.9:1)*zs;
  if(tier('guardian')>=0&&!m.fly&&!rush)for(const h of R.board){if(h.ko||!HEROES[h.k].tr.includes('guardian'))continue;const p=heroPos(h);if(Math.abs(p.x-m.x)<T*1.5&&Math.abs(p.y-m.y)<T*1.5){sp*=1-[.2,.4][tier('guardian')];break}}
  if(!m.fly&&m.c>=0&&R.field.ter){const t=R.field.ter[m.r*COLS+m.c];if(t===2)sp*=rush?.8:.65;else if(t===3){dealRaw(m,m.max*(m.boss?.002:.014)*dt,null,1);if(Math.random()<dt*2)fx({k:'thorn',x:m.x,y:m.y,dur:.35})}}
  let tx,ty;
  if(m.fly){tx=FW+T;ty=FH/2}
  else{const cl=m.x<T*.15?null:cellOf(m.x,m.y);
    if(!cl&&m.c<0){// still outside: head for the nearest open entrance hex
      let rr=SPAWN_ROWS.filter(q=>R.field.dist[q*COLS]>=0).sort((a,b)=>Math.abs(hy(a)-m.y)-Math.abs(hy(b)-m.y))[0];if(rr==null)rr=SPAWN_ROWS[0];tx=hx(0,rr);ty=hy(rr);if(Math.hypot(tx-m.x,ty-m.y)<T*.3){m.c=0;m.r=rr}}
    else if(m.x>FW-T*.2&&m.c>=0&&R.field.dist[m.r*COLS+m.c]===0){tx=FW+T;ty=m.y}
    else{const [c,r]=cl||[m.c,m.r];if(c!==m.c||r!==m.r){m.c=c;m.r=r;const p=portalAt(c,r),pi=p?R.field.portals.indexOf(p):-1;if(p&&!(m.portals>>pi&1)&&!m.boss)portalSplit(m,p,pi)}
      const d=R.field.dist[r*COLS+c];if(d===0){tx=FW+T;ty=hy(r)}else{const n=nextCell(c,r);if(n){tx=hx(n[0],n[1]);ty=hy(n[1])}else{tx=FW+T;ty=m.y}}}}
  const dx=tx-m.x,dy=ty-m.y,dd=Math.hypot(dx,dy)||1;m.x+=dx/dd*sp*dt;m.y+=dy/dd*sp*dt;if(Math.abs(dx)>2)m.face=dx>0?1:-1;if(Math.abs(dy)>2)m.fy=dy>0?1:-1;
  // traps
  for(const tp of B.traps){if(tp.uses>0&&!m.fly&&Math.hypot(tp.x-m.x,tp.y-m.y)<T*.45&&!tp.hit.has(m.id)){tp.hit.add(m.id);tp.uses--;m.rootT=Math.max(m.rootT,tp.root);dealRaw(m,tp.dmg*(1-m.ar),tp.src,0);fx({k:'ring',x:m.x,y:m.y,r:T*.5,col:'#9aff6a',dur:.35})}}
  // specials
  if(D.heal){m.healT-=dt;if(m.healT<=0){m.healT=3;for(const o of B.mons)if(o!==m&&o.hp>0&&Math.hypot(o.x-m.x,o.y-m.y)<T*1.6){o.hp=Math.min(o.max,o.hp+o.max*.15)}fx({k:'ring',x:m.x,y:m.y,r:T*1.6,col:'#7dff9a',dur:.5})}}
  if(D.summon){m.sumT-=dt;if(m.sumT<=0){m.sumT=6;for(let i=0;i<2;i++){const s=spawnMon(D.summon,0,m.x+(Math.random()-.5)*T*.6,m.y+(Math.random()-.5)*T*.6);s.c=m.c;s.r=m.r;s.portals=-1}fx({k:'ring',x:m.x,y:m.y,r:T,col:'#c07aff',dur:.5})}}
  monAttack(m,dt);
  if(m.x>FW+T*.35){leak(m)}
}
// ---------- monsters fight back: they swing at heroes they pass, they don't stop walking ----------
const heroUp=h=>!h.ko&&h.hp>0;
function mDmg(m){const A=MON[m.k].atk;return mDmgBase(R.wave)*(A?A.m:.6)*(m.elite?1.8:1)*(m.boss?2.5:1)*(m.child?.5:1)*(asc(6)?1.3:1)}
function monAttack(m,dt){const A=MON[m.k].atk;if(!A||m.x<0||m.x>FW)return;m.atkT-=dt;if(m.atkT>0)return;
  const rr=A.r*T;let best=null,bs=1e9;
  for(const h of R.board){if(!heroUp(h))continue;const p=heroPos(h),d=Math.hypot(p.x-m.x,p.y-m.y);const chal=HEROES[h.k].fl&&HEROES[h.k].fl.k==='taunt'&&d<=T*1.5;if(d>rr&&!chal)continue;const s=d-(h.tauntT>0||chal?T*9:0)-(HEROES[h.k].tr.includes('guardian')?T*2:0);if(s<bs){bs=s;best=h}}
  if(!best){m.atkT=.25;return}
  m.atkT=A.cd*(.9+Math.random()*.2);const p=heroPos(best),dmg=mDmg(m);m.face=p.x>=m.x?1:-1;m.lunge=.25;if(m.aff==='vamp')m.hp=Math.min(m.max,m.hp+m.max*.04);
  if(A.k==='melee'){hurtHero(best,dmg,m);fx({k:'mslash',x:p.x,y:p.y,dur:.25,face:m.face});sfx('m_hit',.22,.9+Math.random()*.3)}
  else if(A.k==='bolt'){hurtHero(best,dmg,m);if(A.chill)best.chillT=2.5;fx({k:'mbolt',x:m.x,y:m.y,x1:p.x,y1:p.y,dur:.3,col:A.chill?'#8ad8ff':m.k==='ghost'?'#b8ffd8':'#c07aff'});sfx('sp_arcane',.12,1.3)}
  else if(A.k==='slam'){for(const h of R.board){if(!heroUp(h))continue;const q=heroPos(h);if(Math.hypot(q.x-m.x,q.y-m.y)<=rr)hurtHero(h,dmg,m)}fx({k:'ring',x:m.x,y:m.y,r:rr,col:'#d8a060',dur:.4});shake(m.boss?6:3);sfx('m_slam',.35,.8+Math.random()*.2)}
  else if(A.k==='breath'){const a=Math.atan2(p.y-m.y,p.x-m.x);for(const h of R.board){if(!heroUp(h))continue;const q=heroPos(h),dx=q.x-m.x,dy=q.y-m.y;if(Math.hypot(dx,dy)>rr)continue;let da=Math.atan2(dy,dx)-a;da=Math.atan2(Math.sin(da),Math.cos(da));if(Math.abs(da)<.6)hurtHero(h,dmg,m)}fx({k:'cone',x:m.x,y:m.y,a,r:rr,dur:.6,col:'#ff7a2a'});shake(5);sfx('sp_breath',.4,.8)}}
function hurtHero(h,d,m){if(!heroUp(h))return;let dr=h.au?h.au.dr:0;if(HEROES[h.k].fl&&HEROES[h.k].fl.k==='taunt')dr+=.3;if(R.b&&R.b.fl&&R.b.fl.some(f=>f.sanct&&Math.hypot(f.x-hx(h.c,h.r),f.y-hy(h.r))<T*2.1))dr+=.25;
  d*=1-Math.min(.75,dr);h.hp-=d;h.hurtT=.18;
  if(m&&hasIt(h,'bramble')&&m.hp>0)dealRaw(m,heroStats(h).dmg*2,h,1);
  if(h.hp<=0&&priestessSave(h))return;
  if(h.hp<=0){h.hp=0;h.ko=1;h.mana=0;R.b.ko++;const p=heroPos(h);floatText(p.x,p.y-T*.4,'Knocked out','#ff8a7a',.9);fx({k:'die',x:p.x,y:p.y,dur:.5,col:'#ff8a7a',r:T*.5});sfx('block',.4,.8)}}
function healHero(h,amt){if(!heroUp(h)||!(amt>0))return;const before=h.hp;h.hp=Math.min(h.hpMax,h.hp+amt);if(h.hp-before>h.hpMax*.08){const p=heroPos(h);if(TXT.length<20)floatText(p.x,p.y-T*.5,'+'+fmt(h.hp-before),'#7dff9a',.8)}}
function portalSplit(m,p,pi){
  m.portals|=1<<pi;const v=portalMul(p),bv=.35*(has('baron')?2:1)*(has('riftlord')?3:1);m.bounty+=bv;
  for(let i=1;i<v;i++){const c=spawnMon(m.k,m.elite,m.x+(Math.random()-.5)*T*.5,m.y+(Math.random()-.5)*T*.5,m.hp/m.max*.7);c.portals=m.portals;c.bounty=m.bounty;c.c=m.c;c.r=m.r;c.psn=m.psn?Object.assign({},m.psn):null}
  p.flash=.4;fx({k:'ring',x:hx(p.c,p.r),y:hy(p.r),r:T*.7,col:'#c07aff',dur:.4});if(Math.random()<.4)sfx('zap',.25,1.3)}
function leak(m){R.lastLeak=m.k;if(MON[m.k].final){R.devHp=m.hp/m.max;}m.hp=0;m.dead=1;R.hp-=m.w;R.b.leaked+=m.w;R.stats.leaks+=m.w;R.leakAct+=m.w;shake(m.boss?14:5);sfx('lost',.5);floatText(FW+T*.2,m.y,'-'+m.w,'#ff5a5a',1)}
// ---------- poison: stacks that eat a share of the hero's damage every second ----------
function poison(m,src,n,s){if(m.hp<=0||!(n>0))return;const per=(s||heroStats(src)).dmg*.12,p=m.psn||(m.psn={n:0,dps:0,t:0,src});p.n=Math.min(12,p.n+n);p.dps=Math.max(p.dps,per);p.t=4;p.src=src;if(p.n>=10)award('plague10')}
// ---------- damage ----------
function hit(m,amt,src,opt){
  if(m.hp<=0||m.phased)return 0;opt=opt||{};const D=src?HEROES[src.k]:null,tr=D?D.tr:[];
  if(src&&!opt.spell&&D.fl){const F=D.fl.k,uc=MON[m.k].final?.2:m.boss?.4:1;if(F==='hamstring'){m.slowT=Math.max(m.slowT,2);m.slowP=Math.min(m.slowP,.65)}if(F==='bulwark')m.stunT=Math.max(m.stunT,.5*uc);if(F==='sleep'&&src.ac%4===0&&!(m.sleepT>0)){m.sleepT=2.5*uc;m.sleepHp=m.hp;fx({k:'zz',x:m.x,y:m.y,dur:1})}}
  if(src&&tr.includes('shadow')&&tier('shadow')>=0&&m.hp<m.max/2)amt*=1+[.25,.6,1.1][tier('shadow')];
  if(src&&tr.includes('wildwood')&&tier('wildwood')>=0){m.slowT=1.5;m.slowP=Math.min(m.slowP,1-[.15,.25,.35][tier('wildwood')])}
  if(src&&!opt.spell&&tr.includes('guardian')&&tier('guardian')>=0){src.hits++;if(src.hits%3===0)m.stunT=Math.max(m.stunT,[.4,.8][tier('guardian')])}
  if(src&&!opt.spell&&!opt.chainHit&&tr.includes('plague')&&tier('plague')>=0)poison(m,src,1);
  if(src&&opt.spell&&hasIt(src,'censer'))poison(m,src,2);
  if(src&&!opt.spell){let kb=tr.includes('bruiser')&&tier('bruiser')>=0?[.25,.5][tier('bruiser')]:0;if(D.fl&&D.fl.k==='gore')kb+=.5;if(kb)knock(m,kb)}
  if(src&&!opt.spell&&tr.includes('beast')&&tier('beast')>=1)healHero(src,src.hpMax*.02);
  const red=src&&hasIt(src,'veil')?0:(opt.dt||(D&&D.dt))==='m'?m.mr:m.ar;amt*=1-red;
  const d=dealRaw(m,amt,src,0,opt);
  if(src&&opt.spell&&hasIt(src,'soulreaver'))healHero(src,d*.3);if(src&&src.k==='vampire')healHero(src,d*.15);
  if(src&&m.aff==='thorns'&&!opt.spell&&d>0&&R.b)hurtHero(src,Math.min(d*.1,mDmg(m)*.6),null);
  return d}
function dealRaw(m,amt,src,dot,opt){
  if(m.hp<=0||!(amt>0))return 0;if(m.dreadT>0)amt*=1.2;if(m.shellT>0){if(!m.capMsg){m.capMsg=.6;floatText(m.x,m.y-T*1.6,'IMMUNE','#c07aff',1)}return 0}if(m.cap){const a=Math.min(amt,m.capLeft);if(a<amt&&!m.capMsg){m.capMsg=.6;floatText(m.x,m.y-T*1.6,'INVINCIBLE','#c07aff',1)}amt=a;m.capLeft-=a;if(!(amt>0))return 0}
  if(m.sleepT>0&&m.sleepHp-m.hp+amt>m.max*.1)m.sleepT=0;if(m.sh>0){const a=Math.min(m.sh,amt);m.sh-=a;amt-=a;if(!(amt>0))return 0}const d=Math.min(m.hp,amt);if(src)src.wd=(src.wd||0)+d;m.hp-=amt;R.stats.dmg+=d;if(!dot)m.hitT=.12;
  if(!dot&&SET.nums&&TXT.length<18&&(opt&&(opt.crit||opt.mult>1)||opt&&opt.big&&Math.random()<.5||Math.random()<.06))floatText(m.x,m.y-T*.6,fmt(amt),opt&&opt.crit?'#ffd76a':opt&&opt.mult>1?'#c9a8ff':'#ffffff',opt&&opt.crit||opt&&opt.mult>1?1.15:.85);
  if(m.hp>0&&has('reaper')&&!m.boss&&m.hp<m.max*.12)m.hp=0;
  if(m.hp<=0&&!m.dead)kill(m,src,opt);return d}
function kill(m,src,opt){
  m.dead=1;R.stats.kills++;R.b.kills++;META.kills=(META.kills||0)+1;if(m.elite)META.elk=(META.elk||0)+1;if(m.boss){META.bk=META.bk||{};const bk=BOSSEQ[m.k]||m.k;META.bk[bk]=(META.bk[bk]||0)+1}
  if(src&&src.k==='wyrm'){src.hoard=Math.min(200,(src.hoard||0)+1);if(src.hoard>=60)award('hoard60')}if(opt&&opt.charm)award('charm');
  let g=m.bounty+(m.boss?12:0);if(opt&&opt.gold)g+=1;if(src&&hasIt(src,'thief')&&Math.random()<.4)g+=1;if(m.portals>0)R.portalGold+=m.bounty;if(R.portalGold>=50)award('portal50');
  if(g>0){R.goldFrac+=g;const w=Math.floor(R.goldFrac);if(w>0){R.goldFrac-=w;R.gold+=w;floatText(m.x,m.y-T*.9,'+'+w+'g','#ffcf2e',1);sfx('coin',.35,1+Math.random()*.2)}}
  if(m.boss){R.stones.push(2);banner('BOSS DEFEATED','#ffd76a');shake(16);sfx('boomBig',.8);dropItem(rndS(COMPS),m.x,m.y);dropItem(rndS(COMPS),m.x,m.y)}
  else if(m.elite&&!m.child&&!(m.portals>0)&&R.b.drops<3){R.b.drops++;dropItem(rndS(COMPS),m.x,m.y)}
  // the plague spreads from the dead
  if(m.psn&&tier('plague')>=2&&m.psn.n>1){const n=Math.ceil(m.psn.n/2);for(const o of R.b.mons)if(o!==m&&o.hp>0&&Math.hypot(o.x-m.x,o.y-m.y)<T*1.5)poison(o,m.psn.src,n);fx({k:'ring',x:m.x,y:m.y,r:T*1.5,col:'#a6e04a',dur:.35})}
  const D=MON[m.k];if(D.split&&!m.child)for(let i=0;i<D.split;i++){const c=spawnMon(m.k,0,m.x+(i?8:-8),m.y+(i?6:-6));c.max=m.max*.4;c.hp=c.max;c.child=1;c.portals=m.portals;c.bounty=0;c.c=m.c;c.r=m.r;c.sz=.65}
  fx({k:'corpse',x:m.x,y:m.y,mk:m.k,face:m.face,sz:m.sz||MON[m.k].sz,fly:m.fly,boss:m.boss,dur:m.boss?1.2:.5});
  fx({k:'die',x:m.x,y:m.y,dur:.45,col:m.boss?'#ffcf6a':'#d8d0c0',r:T*(MON[m.k].sz||1)*.6});
  if(m.boss||m.elite||m.big)sfx('crunch',.45,.9+Math.random()*.2);
}
// ---------- heroes ----------
function heroPos(h){return{x:hx(h.c,h.r),y:hy(h.r)}}
function heroTick(h,dt){
  if(h.hurtT>0)h.hurtT-=dt;if(h.ko)return;if(h.seizT>0){h.seizT-=dt;return}
  const D=HEROES[h.k],s=heroStats(h),p=heroPos(h),B=R.b,I=itemStats(h);
  if(h.atk>0)h.atk-=dt;if(h.buffT>0)h.buffT-=dt;if(h.chillT>0)h.chillT-=dt;if(h.tauntT>0)h.tauntT-=dt;h.cd-=dt;
  if(hasIt(h,'warmog')&&h.hp<h.hpMax)h.hp=Math.min(h.hpMax,h.hp+h.hpMax*.05*dt);if(h.au&&h.au.heal&&h.hp<h.hpMax)h.hp=Math.min(h.hpMax,h.hp+h.hpMax*h.au.heal*dt);
  const regen=(tier('sorcerer')>=0?[2,5,10][tier('sorcerer')]:0)+(I.regen||0);h.mana+=regen*dt*(has('arcana')?1.5:1);
  if(h.cd>0)return;
  const rr=s.rng*T;let best=null,bp=1e9;for(const m of B.mons){if(!targetable(m))continue;const d=Math.hypot(m.x-p.x,(m.y-p.y));if(d>rr+T*.3)continue;const pr=progress(m);if(pr<bp){bp=pr;best=m}}
  if(!best)return;
  h.cd=1/s.as;h.atk=.42;h.face=best.x>=p.x?1:-1;h.fy=best.y>=p.y?1:-1;h.ac++;h.stk++;
  h.mana+=(10+(hasIt(h,'spear')?8:0))*(has('arcana')?1.5:1);
  if(h.mana>=D.mana){h.mana=hasIt(h,'sigil')?30:0;cast(h,s,best);if(has('echo')&&Math.random()<.35)setTimeoutSafe(()=>{if(R&&R.b&&R.board.includes(h)&&!h.ko)cast(h,heroStats(h),best.hp>0?best:monAlive()[0]||best)},250);return}
  const crit=Math.random()<s.crit,dmg=s.dmg*(crit?s.cm:1);
  const strike=(m,o)=>{if(D.proj==='melee'||D.proj==='claw'){hit(m,dmg*(o||1),h,{crit});fx({k:'slash',x:m.x,y:m.y,dur:.18,col:D.proj==='claw'?'#ff6a8a':'#ffffff',face:h.face})}else shoot(h,p,m,dmg*(o||1),{crit,kind:D.proj})};
  strike(best);if(D.proj==='melee'||D.proj==='claw')sfx('hit',.18,1.1+Math.random()*.3);
  if(hasIt(h,'quiver')){const o=B.mons.find(m=>m!==best&&m.hp>0&&Math.hypot(m.x-p.x,m.y-p.y)<rr+T*.3);if(o)strike(o)}
  if(hasIt(h,'storm')&&h.ac%3===0)chainBolt(h,p,best,s.dmg*.8,4,'#9ad8ff');
}
function shoot(h,p,m,dmg,o){const ra=h&&hasIt(h,'runearrow');R.b.projs.push({x:p.x,y:p.y-T*.25,tg:m,tx:m.x,ty:m.y,dmg,src:h,crit:o.crit,kind:o.kind,mult:ra?1.5:1,ra,mask:0,sp:o.sp||T*9,c:-2,r:-2,spell:o.spell,aoe:o.aoe||0,fxk:o.fxk});if(o.kind==='arrow'||o.kind==='bolt')sfx('rail',.12,1.6+Math.random()*.3)}
function projTick(q,dt){
  if(q.tg&&q.tg.hp>0){q.tx=q.tg.x;q.ty=q.tg.y-T*.15}
  const dx=q.tx-q.x,dy=q.ty-q.y,d=Math.hypot(dx,dy),step=q.sp*dt;
  if(d<=step+4){q.x=q.tx;q.y=q.ty;q.done=1;
    const o={crit:q.crit,mult:q.mult,spell:q.spell,big:q.mult>1};
    if(q.aoe){for(const m of R.b.mons)if(m.hp>0&&Math.hypot(m.x-q.x,m.y-q.y)<q.aoe){hit(m,q.dmg*q.mult,q.src,o);if(q.stun)m.stunT=Math.max(m.stunT,MON[m.k].final?.15:q.stun)}fx({k:'ring',x:q.x,y:q.y,r:q.aoe,col:'#ffb060',dur:.3});if(q.kind==='boulder'){shake(3);fx({k:'die',x:q.x,y:q.y,dur:.5,col:'#a08060',r:T*.8})}}
    else if(q.tg&&q.tg.hp>0)hit(q.tg,q.dmg*q.mult,q.src,o);
    if(q.kind==='flask'&&!LQ())fx({k:'ring',x:q.x,y:q.y,r:T*.35,col:'#a6e04a',dur:.25});
    if(q.mult>=9)award('rune9');return}
  q.x+=dx/d*step;q.y+=dy/d*step;
  // crossing a rune tile multiplies the shot, once per rune
  const cl=cellOf(q.x,q.y),c=cl?cl[0]:-1,r=cl?cl[1]:-1;if(c!==q.c||r!==q.r){q.c=c;q.r=r;const ru=cl?runeAt(c,r):null;if(ru){const i=R.field.runes.indexOf(ru);if(!(q.mask>>i&1)){q.mask|=1<<i;q.mult*=runeMul(ru)+(q.ra?1:0);ru.flash=.25}}}
}
// runes a straight line crosses (for lines and beams)
function lineMult(x0,y0,x1,y1,extra){let m=1,mask=0;const n=Math.ceil(Math.hypot(x1-x0,y1-y0)/(T/4));for(let i=0;i<=n;i++){const cl=cellOf(lerp(x0,x1,i/n),lerp(y0,y1,i/n));if(!cl)continue;const ru=runeAt(cl[0],cl[1]);if(ru){const k=R.field.runes.indexOf(ru);if(!(mask>>k&1)){mask|=1<<k;m*=runeMul(ru)+(extra||0);ru.flash=.3}}}return m}
function chainBolt(h,from,first,dmg,n,col,o){let cur=first,done=new Set();for(let i=0;i<n&&cur;i++){done.add(cur);hit(cur,dmg,h,Object.assign({chainHit:1},o||{}));fx({k:'bolt',x:from.x,y:from.y,x1:cur.x,y1:cur.y,dur:.25,col});from={x:cur.x,y:cur.y};let nb=null,nd=T*2.5;for(const m of R.b.mons){if(m.hp<=0||done.has(m))continue;const d=Math.hypot(m.x-cur.x,m.y-cur.y);if(d<nd){nd=d;nb=m}}cur=nb}}
function cast(h,s,tg){
  const D=HEROES[h.k],A=D.ab,p=heroPos(h),B=R.b,crit=hasIt(h,'gauntlet')&&Math.random()<s.crit,pw=s.dmg*A.m*s.spell*(crit?s.cm:1),o={spell:1,dt:D.dt,big:1,crit};
  h.atk=.6;fx({k:'cast',x:p.x,y:p.y,dur:.5,col:TRAITS[D.tr[1]].col});if(TXT.filter(t=>t.cast).length<3){floatText(p.x,p.y-T*.75,D.ab.n+'!',TRAITS[D.tr[1]].col,.9);TXT[TXT.length-1].cast=1}sfx(A.snd||'zap',.32,.92+Math.random()*.16);
  const inR=(x,y,r)=>B.mons.filter(m=>m.hp>0&&Math.hypot(m.x-x,m.y-y)<r);
  if(hasIt(h,'bloom'))for(const x of R.board){const q=heroPos(x);if(Math.hypot(q.x-p.x,q.y-p.y)<=T*2.1)healHero(x,x.hpMax*.25)}
  if(A.k==='nova'){const cx=A.self?p.x:tg.x,cy=A.self?p.y:tg.y,r=A.r*T;
    for(const m of inR(cx,cy,r)){if(A.m>0)hit(m,A.dot?pw*.3:pw,h,o);if(A.stun)m.stunT=Math.max(m.stunT,A.stun);if(A.kb)knock(m,A.kb);if(A.root)m.rootT=Math.max(m.rootT,A.root);if(A.burn)m.dots.push({dps:pw*.5/3*(1-m.mr),t:3,src:h});if(A.dot)m.dots.push({dps:s.dmg*A.dot*s.spell/4*(1-m.mr),t:4,src:h});
      if(A.psn)poison(m,h,A.psn,s);if(A.slow){m.slowT=Math.max(m.slowT,3+(A.stun||0));m.slowP=Math.min(m.slowP,1-A.slow)}}
    if(A.heal){R.hp=Math.min(R.hpMax,R.hp+A.heal);floatText(FW+T*.2,FH/2-T,'+'+A.heal,'#7dff9a',1);
      if(h.k==='paladin')for(const x of R.board){const q=heroPos(x);if(Math.hypot(q.x-p.x,q.y-p.y)<=r+T*.5)healHero(x,x.hpMax*.15)}else healHero(h,h.hpMax*.3)}
    if(h.k==='vampire'){const c=inR(p.x,p.y,s.rng*T+T*.4).filter(m=>!m.boss&&!(m.charmT>0)).sort((a,b)=>b.hp-a.hp)[0];if(c){c.charmT=6;c.charmBy=h;fx({k:'ring',x:c.x,y:c.y,r:T*.6,col:'#ff4a8a',dur:.6});floatText(c.x,c.y-T,'Charmed!','#ff8ab0',1)}}
    if(A.taunt){h.tauntT=A.taunt;fx({k:'ring',x:p.x,y:p.y,r:T*2.2,col:'#ff5a3a',dur:.6})}
    fx({k:A.ice?'ice':A.psn?'poison':A.root?'roots':A.burn?'fire':A.dot?'hex':'nova',x:cx,y:cy,r,dur:.55,col:TRAITS[D.tr[1]].col});shake(A.taunt?6:2)}
  else if(A.k==='fan'){const ts=B.mons.filter(m=>m.hp>0&&Math.hypot(m.x-p.x,m.y-p.y)<s.rng*T+T*.3).sort((a,b)=>progress(a)-progress(b));for(let i=0;i<A.shots;i++){const m=ts[i%Math.max(1,ts.length)]||tg;shoot(h,p,m,s.dmg*A.m*s.spell,{kind:D.proj==='melee'?'star':D.proj,spell:1,crit:Math.random()<s.crit})}}
  else if(A.k==='execute'){const ts=inR(p.x,p.y,s.rng*T+T*.3);const m=A.strong?ts.sort((a,b)=>b.hp-a.hp)[0]:ts.sort((a,b)=>a.hp-b.hp)[0];if(m){hit(m,pw,h,{spell:1,dt:D.dt,big:1,gold:A.gold,crit:1});if(A.kb)knock(m,A.kb);if(A.stun)m.stunT=Math.max(m.stunT,A.stun*(m.boss?.4:1));fx({k:'slash',x:m.x,y:m.y,dur:.3,col:'#ff4a6a',face:h.face,big:1});shake(3)}if(A.heal)healHero(h,h.hpMax*A.heal)}
  else if(A.k==='pierce'){const a=Math.atan2(tg.y-p.y,tg.x-p.x),L=s.rng*T*1.7,x1=p.x+Math.cos(a)*L,y1=p.y+Math.sin(a)*L,mm=lineMult(p.x,p.y,x1,y1,hasIt(h,'runearrow')?1:0)*(hasIt(h,'runearrow')?1.5:1);
    for(const m of B.mons){if(m.hp<=0)continue;const t=clamp(((m.x-p.x)*Math.cos(a)+(m.y-p.y)*Math.sin(a))/L,0,1),qx=p.x+Math.cos(a)*L*t,qy=p.y+Math.sin(a)*L*t;if(Math.hypot(m.x-qx,m.y-qy)<T*.4)hit(m,pw*mm,h,{spell:1,dt:D.dt,mult:mm,big:1})}
    fx({k:'line',x:p.x,y:p.y,x1,y1,dur:.3,col:'#ffd76a',mult:mm})}
  else if(A.k==='chain')chainBolt(h,p,tg,pw,A.n2,'#c9a8ff',{spell:1,dt:D.dt,big:1});
  else if(A.k==='trap'){let tx=tg.x,ty=tg.y;if(!tg.fly&&tg.c>=0&&tg.c<COLS){const n=nextCell(tg.c,tg.r);if(n){tx=hx(n[0],n[1]);ty=hy(n[1])}}B.traps.push({x:tx,y:ty,root:A.root,dmg:pw,uses:3,t:9,src:h,hit:new Set()});shoot(h,p,tg,s.dmg,{kind:'bolt'})}
  else if(A.k==='buff'){h.buffT=A.t;h.buffAs=A.as;fx({k:'nova',x:p.x,y:p.y,r:T*.8,dur:.4,col:'#ff6a8a'})}
  else if(A.k==='beam'){const y=tg.y,mm=lineMult(0,y,FW,y);for(const m of B.mons)if(m.hp>0&&Math.abs(m.y-y)<T*.55)hit(m,pw*mm,h,{spell:1,dt:D.dt,mult:mm,big:1});fx({k:'beam',x:0,y,x1:FW,y1:y,dur:.5,col:'#ffe9a0',mult:mm});shake(5)}
  else if(A.k==='cone'){const a=Math.atan2(tg.y-p.y,tg.x-p.x),r=A.r*T;for(const m of B.mons){if(m.hp<=0)continue;const dx=m.x-p.x,dy=m.y-p.y,d=Math.hypot(dx,dy);if(d>r)continue;let da=Math.atan2(dy,dx)-a;da=Math.atan2(Math.sin(da),Math.cos(da));if(Math.abs(da)<.65){hit(m,pw,h,o);if(A.burn)m.dots.push({dps:pw*.4/3*(1-m.mr),t:3,src:h})}}fx({k:'cone',x:p.x,y:p.y,a,r,dur:.5,col:'#ff7a2a'});shake(3);
    if(h.k==='wyrm'&&(h.hoard||0)>=60){const y=tg.y;for(const m of B.mons)if(m.hp>0&&Math.abs(m.y-y)<T*.55)hit(m,pw*.6,h,o);fx({k:'beam',x:0,y,x1:FW,y1:y,dur:.5,col:'#ff7a2a'})}}
  else if(A.k==='miasma'){let x=tg.x,y=tg.y;if(!tg.fly&&tg.c>=0&&tg.c<COLS){const n=nextCell(tg.c,tg.r);if(n){x=hx(n[0],n[1]);y=hy(n[1])}}
    B.zones.push({x,y,r:A.r*T,t:A.t,tick:0,src:h,psn:A.psn,s});for(const x2 of R.board){const q=heroPos(x2);if(Math.hypot(q.x-p.x,q.y-p.y)<=T*2.1)healHero(x2,x2.hpMax*A.heal)}fx({k:'poison',x,y,r:A.r*T,dur:.6,col:'#a6e04a'})}
  else if(A.k==='pest'){const r=A.r*T;for(const m of inR(tg.x,tg.y,r)){if(m.psn){hit(m,m.psn.n*m.psn.dps*2*s.spell*(tier('plague')>=1?2:1),h,{spell:1,dt:'m',big:1})}if(m.hp>0)poison(m,h,A.psn,s)}fx({k:'poison',x:tg.x,y:tg.y,r,dur:.7,col:'#a6e04a'});fx({k:'hex',x:tg.x,y:tg.y,r:r*.7,dur:.5,col:'#a6e04a'});shake(3)}
}
// echoes run on the game clock so they respect pause and speed
const LATER=[];function setTimeoutSafe(f,ms){LATER.push({f,t:ms/1000})}
function battleTick(dt){
  const B=R.b;B.t+=dt;
  B.fl=[];for(const h of R.board){if(!heroUp(h))continue;const D=HEROES[h.k];if(D.fl||h.k==='templar')B.fl.push({h,x:hx(h.c,h.r),y:hy(h.r),k:D.fl?D.fl.k:'',sanct:h.k==='templar'})}
  keepTick(dt);
  if(B.ts>0){B.ts-=dt;for(const h of R.board)heroTick(h,dt);for(const q of B.projs)projTick(q,dt);B.projs=B.projs.filter(q=>!q.done);B.mons=B.mons.filter(m=>m.hp>0);if(!B.q.length&&!B.mons.length)endWave();return}
  if(B.q.length){B.qT-=dt;if(B.qT<=0){const e=B.q.shift();spawnMon(e.k,e.elite,null,null,null,e.g);B.qT=Math.max(.32,.75-.012*R.wave)*(MON[e.k].boss?2.5:1)}}
  for(const m of B.mons)if(m.hp>0)monTick(m,dt);
  for(const h of R.board)heroTick(h,dt);
  for(const q of B.projs)projTick(q,dt);B.projs=B.projs.filter(q=>!q.done);
  for(const tp of B.traps)tp.t-=dt;B.traps=B.traps.filter(tp=>tp.t>0&&tp.uses>0);
  if(B.rageT>0)B.rageT-=dt;
  for(const z of B.zones){z.t-=dt;z.tick-=dt;if(z.tick<=0){z.tick=1;for(const m of B.mons)if(m.hp>0&&!m.fly&&Math.hypot(m.x-z.x,m.y-z.y)<z.r)poison(m,z.src,z.psn,z.s)}}B.zones=B.zones.filter(z=>z.t>0);
  for(const l of LATER)l.t-=dt;const due=LATER.filter(l=>l.t<=0);for(const l of due){LATER.splice(LATER.indexOf(l),1);l.f()}
  B.mons=B.mons.filter(m=>m.hp>0);
  if(R.hp<=0){R.hp=0;runOver(false);return}
  if(!B.q.length&&!B.mons.length)endWave();
}

// ---------- charmed monsters walk back towards the portal and fight their own kind ----------
function charmTick(m,dt){m.charmT-=dt;const B=R.b;let tx=m.x-T,ty=m.y;
  if(m.c>=0&&!m.fly){let best=null,bd=-1;for(const [c,r] of nbrs(m.c,m.r)){const v=R.field.dist[r*COLS+c];if(v>bd){bd=v;best=[c,r]}}if(best){tx=hx(best[0],best[1]);ty=hy(best[1])}const cl=cellOf(m.x,m.y);if(cl){m.c=cl[0];m.r=cl[1]}}
  const dx=tx-m.x,dy=ty-m.y,dd=Math.hypot(dx,dy)||1;if(m.x>T*.2){m.x+=dx/dd*m.sp*T*.7*dt;m.y+=dy/dd*m.sp*T*.7*dt}m.face=dx>0?1:-1;
  m.catk=(m.catk||0)-dt;if(m.catk<=0){let o=null,od=T*1.6;for(const q of B.mons){if(q===m||q.hp<=0||q.charmT>0)continue;const d=Math.hypot(q.x-m.x,q.y-m.y);if(d<od){od=d;o=q}}
    if(o){m.catk=1;m.lunge=.25;dealRaw(o,Math.max(mDmg(m)*4,o.max*.06),m.charmBy||null,0,{charm:1});fx({k:'mslash',x:o.x,y:o.y,dur:.25,face:m.face})}}}
// knockback: shove a walker back up the road (towards higher distance from the keep), in hexes
function knock(m,hexes){if(m.hp<=0||m.fly||MON[m.k].final||m.c<0)return;m.kb=Math.min(T*2.2,(m.kb||0)+hexes*T*(m.boss?.33:m.big?.6:1))}
function kbTick(m,dt){const d=R.field.dist;if(!d||m.c<0){m.kb=0;return}const cur=d[m.r*COLS+m.c];let best=null,bd=cur;
  for(const [c,r] of nbrs(m.c,m.r)){const v=d[r*COLS+c];if(v>bd){bd=v;best=[c,r]}}if(!best){m.kb=0;return}
  const tx=hx(best[0],best[1]),ty=hy(best[1]),dx=tx-m.x,dy=ty-m.y,dd=Math.hypot(dx,dy)||1,st=Math.min(m.kb,T*7*dt,dd);m.x+=dx/dd*st;m.y+=dy/dd*st;m.kb-=st;
  if(dd-st<T*.1){m.c=best[0];m.r=best[1]}if(st<.01)m.kb=0}
// a breach tears open on a free hex of the road and spills monsters
function openRift(n,elite){const F=R.field,d=F.dist;if(!d)return;const opts=[];for(let r=0;r<ROWS;r++)for(let c=2;c<COLS-2;c++){const v=d[r*COLS+c];if(v>=6&&v<=22&&!F.blk[r*COLS+c])opts.push([c,r])}if(!opts.length)return;
  const [c,r]=rnd(opts),x=hx(c,r),y=hy(r);fx({k:'breach',x,y,dur:2.4});fx({k:'ring',x,y,r:T*1.1,col:'#c07aff',dur:.6});sfx('zap',.4,.6);
  for(let i=0;i<n+1;i++){const m=spawnMon(rndS(actD(R.act).roster),i<elite?1:0,x+(Math.random()-.5)*T*.4,y+(Math.random()-.5)*T*.4);m.c=c;m.r=r;m.portals=-1;if(m.elite&&!m.aff)m.aff=rnd(AFFKEYS)}}
// ---------- the Rune Devourer: barely hurt by anything, it heals, it hunts your best heroes and eats your runes ----------
// it takes at most CAP of its health per second, regrows REGEN per second, and every quarter of its health it sheds a shell
const DEV={cap:.016,regen:.002,beat:7,beatP:.07,beatUp:.01,shell:3.5};
function finalTick(m,dt){const B=R.b;m.capT-=dt;if(m.capT<=0){m.capT=1;m.capLeft=m.max*DEV.cap*(m.phase>=3?.8:1)}if(m.capMsg>0)m.capMsg-=dt;
  m.stunT=Math.min(m.stunT,.12);m.rootT=Math.min(m.rootT,.12);m.sleepT=0;m.slowP=Math.max(m.slowP,.8);m.charmT=0;m.dots=m.dots.filter(o=>o.t>0).slice(0,3);
  if(m.hp<m.max)m.hp=Math.min(m.max,m.hp+m.max*DEV.regen*dt*(m.phase>=2?1.6:1));
  if(m.shellT>0){m.shellT-=dt;if(m.shellT<=0)m.cap=1}
  // Beat of Death: every beat hurts every hero, and each beat is harder than the last
  m.bodT-=dt;if(m.bodT<=0){m.beats=(m.beats||0)+1;m.bodT=m.phase>=3?5:m.phase>=2?6:DEV.beat;const p=DEV.beatP+DEV.beatUp*m.beats;
    for(const h of R.board)if(heroUp(h))hurtHero(h,h.hpMax*p,null);fx({k:'ring',x:m.x,y:m.y,r:FW*.7,col:'#c07aff',dur:.8});shake(6);sfx('boomBig',.5,.6);floatText(m.x,m.y-T*1.8,`Beat of Death ${Math.round(p*100)}%`,'#c07aff',1.1)}
  // the Maw: seizes the hero doing the most damage and drains it
  if(m.phase>=1){m.mawT=(m.mawT??4)-dt;if(m.mawT<=0){m.mawT=m.phase>=3?6:9;const t=R.board.filter(h=>heroUp(h)&&!(h.seizT>0)).sort((a,b)=>(b.wd||0)-(a.wd||0))[0];
    if(t){t.seizT=3.5;hurtHero(t,t.hpMax*.3,null);const p=heroPos(t);fx({k:'mbolt',x:m.x,y:m.y-T,x1:p.x,y1:p.y,dur:.6,col:'#c07aff'});fx({k:'ring',x:p.x,y:p.y,r:T*.8,col:'#c07aff',dur:.6});floatText(p.x,p.y-T,'SEIZED','#d6a8ff',1)}}}
  // Rune Hunger: eats a rune stone off the field and grows stronger
  if(m.phase>=2){m.runeT=(m.runeT??3)-dt;if(m.runeT<=0){m.runeT=10;const ru=R.field.runes.filter(q=>q.v>0).sort((a,b)=>b.v-a.v)[0];
    if(ru){ru.v--;ru.flash=1;if(ru.v<=0)R.field.runes.splice(R.field.runes.indexOf(ru),1);m.hp=Math.min(m.max,m.hp+m.max*.02);fx({k:'mbolt',x:m.x,y:m.y-T,x1:hx(ru.c,ru.r),y1:hy(ru.r),dur:.5,col:'#c07aff'});floatText(hx(ru.c,ru.r),hy(ru.r)-T*.5,'DEVOURED','#d6a8ff',1)}}}
  // Rifts: in its last phases it tears holes in the field that spill monsters
  if(m.phase>=2){m.riftT=(m.riftT??2)-dt;if(m.riftT<=0){m.riftT=m.phase>=3?7:10;if(typeof openRift==='function')openRift(m.phase>=3?2:1,1)}}
  const ph=m.hp<m.max*.25?3:m.hp<m.max*.5?2:m.hp<m.max*.75?1:0;
  if(ph>m.phase){m.phase=ph;m.cap=0;m.shellT=DEV.shell;m.hp=Math.min(m.max,m.hp+m.max*.03);
    banner(['','THE DEVOURER HUNGERS','THE DEVOURER FEASTS ON RUNES','THE DEVOURER UNMAKES THE WORLD'][ph],'#c07aff');shake(12);floatText(m.x,m.y-T*2.2,'SHELL: IMMUNE','#d6a8ff',1.4);
    if(ph>=3)m.sp*=1.25;
    for(let i=0;i<2+ph*2;i++){const e=spawnMon(rndS(actD(2).roster),i<ph?1:0);if(e.elite&&!e.aff)e.aff=rnd(AFFKEYS)}}}
