// ---------- keep guardians: the keep fights too ----------
// META.gl[k] = level (0 = locked), META.geq = equipped keys. Deeds unlock some guardians for free; others cost gems.
const gSlots=()=>1+rank('keep2');
function gDeed(k){const U=GUARDS[k].un;if(!U)return true;if(U.gems)return false;if(U.ach)return !!META.ach[U.ach];if(U.kills)return(META.kills||0)>=U.kills;if(U.elites)return(META.elk||0)>=U.elites;if(U.boss)return((META.bk||{})[U.boss[0]]||0)>=U.boss[1];return true}
function gProgress(k){const U=GUARDS[k].un;if(U.kills)return`${Math.min(U.kills,META.kills||0)}/${U.kills}`;if(U.elites)return`${Math.min(U.elites,META.elk||0)}/${U.elites}`;if(U.boss)return`${Math.min(U.boss[1],(META.bk||{})[U.boss[0]]||0)}/${U.boss[1]}`;return''}
// a guardian whose deed is done becomes level 1 for free
function gLevel(k){META.gl=META.gl||{};if(!META.gl[k]&&(k==='archers'||gDeed(k))){META.gl[k]=1;saveMeta()}return META.gl[k]||0}
function guardLoadout(){META.geq=(META.geq||['archers']).filter(k=>GUARDS[k]&&gLevel(k)>0).slice(0,gSlots());if(!META.geq.length)META.geq=['archers'];return META.geq.map(k=>({k,l:gLevel(k),t:1.5}))}
const hasGuard=k=>!!(R&&R.guards&&R.guards.some(g=>g.k===k));
const guardLv=k=>{const g=R&&R.guards&&R.guards.find(q=>q.k===k);return g?g.l:0};
// guardians hit harder as the run goes on, a little slower than monsters grow
const gDmg=l=>10*Math.pow(1.155,R.wave-1)*(1+.3*(l-1));
function keepPos(){return{x:FW+T*.62,y:(hy(KEEP_ROWS[0])+hy(KEEP_ROWS[KEEP_ROWS.length-1]))/2}}
const targetable=m=>m.hp>0&&!m.phased&&!(m.charmT>0);
function guardWave(){const B=R.b;B.revived=0;B.gdmg=0;const s=guardLv('sentinel');if(s){const mx=220*s*Math.pow(1.12,R.wave-1);B.sent={hp:mx,max:mx,t:1}}for(const g of R.guards||[])g.t=Math.min(g.t,GUARDS[g.k].cd||1)}
function keepTick(dt){const B=R.b,K=keepPos(),sp=1+.1*rank('drill');
  for(const g of R.guards||[]){const G=GUARDS[g.k];if(!G.cd)continue;g.t-=dt*sp;if(g.t>0)continue;g.t=G.cd*(1-.05*(g.l-1));const dmg=gDmg(g.l);g.fire=.5;
    if(g.k==='archers'){let best=null,bd=T*5;for(const m of B.mons){if(!targetable(m))continue;const d=Math.hypot(m.x-K.x,m.y-K.y);if(d<bd){bd=d;best=m}}if(best)shoot(null,{x:K.x,y:K.y-T*1.2},best,dmg*.7,{kind:'arrow'});else g.t=.2}
    else if(g.k==='priestess'){for(const h of R.board)healHero(h,h.hpMax*(.08+.02*g.l));R.hp=Math.min(R.hpMax,R.hp+g.l);fx({k:'ring',x:K.x,y:K.y,r:T*1.2,col:'#7ddc6a',dur:.6});if(R.board.length)sfx('sp_heal',.2)}
    else if(g.k==='trebuchet'){let best=null,bn=0;for(const m of B.mons){if(!targetable(m))continue;let n=0;for(const o of B.mons)if(o.hp>0&&Math.hypot(o.x-m.x,o.y-m.y)<T*1.2)n++;if(n>bn){bn=n;best=m}}
      if(best){R.b.projs.push({x:K.x,y:K.y-T*1.4,tg:null,tx:best.x,ty:best.y,dmg:dmg*3,src:null,kind:'boulder',mult:1,mask:0,sp:T*6,c:-2,r:-2,aoe:T*1.2,stun:.8,arc:1,sx0:K.x,sy0:K.y});sfx('m_slam',.2,1.3)}else g.t=.5}
    else if(g.k==='sentinel'&&B.sent&&B.sent.hp>0){let n=0;for(const m of B.mons)if(m.hp>0&&!m.fly&&m.x>FW-T*.5){hit(m,dmg*1.4,null,{});n++}if(n){fx({k:'ring',x:FW,y:K.y,r:T*.9,col:'#b8c2cc',dur:.3});sfx('hit',.25,.7)}}
    else if(g.k==='reaper'){let best=null,bp=2;for(const m of B.mons){if(!targetable(m))continue;const p=m.hp/m.max;if(p<bp){bp=p;best=m}}
      if(best){fx({k:'slash',x:best.x,y:best.y,dur:.35,col:'#c9a8ff',face:-1,big:1});if(!best.boss&&best.hp<best.max*(.1+.02*g.l))dealRaw(best,best.hp+1,null,0,{big:1});else hit(best,dmg*1.5,null,{dt:'m',big:1})}else g.t=.5}
    else if(g.k==='dragon'){let best=null,bd=1e9;for(const m of B.mons){if(!targetable(m))continue;const d=K.x-m.x;if(d<bd){bd=d;best=m}}
      if(best){const y=best.y;for(const m of B.mons)if(m.hp>0&&Math.abs(m.y-y)<T*.55){hit(m,dmg*5,null,{dt:'m',big:1});m.dots.push({dps:dmg*.6,t:3,src:null})}fx({k:'beam',x:FW+T*.3,y,x1:0,y1:y,dur:.6,col:'#ff7a2a'});shake(4);sfx('sp_breath',.4,.9)}else g.t=.5}
    else if(g.k==='chrono'){if(B.mons.some(m=>m.hp>0)){B.ts=2+.3*g.l;fx({k:'ring',x:FW/2,y:FH/2,r:FW*.6,col:'#5fe1ff',dur:.9});sfx('sp_ice',.5,.6);banner('TIME STOPS','#5fe1ff')}else g.t=1}}
  // the sentinel holds the gate while it stands
  if(B.sent&&B.sent.hp>0)for(const m of B.mons){if(m.hp<=0||m.fly||m.x<FW-T*.15)continue;m.x=FW-T*.15;m.satk=(m.satk||0)-dt;if(m.satk<=0){m.satk=1.2;B.sent.hp-=m.boss?mDmg(m)*3:Math.max(mDmg(m),m.max*.02);if(B.sent.hp<=0){B.sent.hp=0;fx({k:'die',x:FW,y:K.y,dur:.6,col:'#b8c2cc',r:T});sfx('crunch',.6);toast('The Stone Sentinel crumbles')}}}}
// the priestess gets a fallen hero back up, once per wave
function priestessSave(h){if(!hasGuard('priestess')||R.b.revived)return false;R.b.revived=1;h.ko=0;h.hp=h.hpMax*.4;const p=heroPos(h);fx({k:'star',x:p.x,y:p.y,dur:.8,col:'#7ddc6a'});floatText(p.x,p.y-T*.6,'Saved!','#7ddc6a',1);return true}
// ---------- drawing: guardian badges on the battlements, the sentinel at the gate, frozen time ----------
const GFIG={archers:'archer',banner:'squire',priestess:'druid',trebuchet:'tinker',sentinel:'warlord',oracle:'apprentice',reaper:'nightblade',dragon:'wyrm',chrono:'frostmage'};
function drawGuards(kx,ky,ks){if(!R.guards)return;const n=R.guards.length,B=R.b;
  // the guardians themselves stand on the wall in front of the keep, facing the field
  R.guards.forEach((g,i)=>{if(g.k==='sentinel')return;const fs=ks*.38,fx=kx-ks*.24+i*ks*.17,fy=ky-ks*.26,busy=g.fire>0,fi=busy?4+Math.min(5,((1-g.fire/.5)*6)|0):((TIME*4+i*2)|0)%4,fr=frame('h_'+GFIG[g.k],160,fi,fs*DPR);
    if(fr){ctx.save();ctx.translate(fx,fy);ctx.scale(-1,1);ctx.drawImage(fr,-fs/2,-fs*.86,fs,fs);ctx.restore()}
    if(g.k==='banner'){ctx.strokeStyle='#d8c8a8';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(fx+fs*.25,fy);ctx.lineTo(fx+fs*.25,fy-fs*1.1);ctx.stroke();ctx.fillStyle='#4a8ae8';ctx.beginPath();ctx.moveTo(fx+fs*.25,fy-fs*1.1);ctx.lineTo(fx+fs*.25+fs*.4,fy-fs*.95+Math.sin(TIME*4)*fs*.05);ctx.lineTo(fx+fs*.25,fy-fs*.8);ctx.fill()}});
  R.guards.forEach((g,i)=>{const G=GUARDS[g.k],r=Math.max(9,ks*.1),x=kx+ks*.33,y=ky-ks*.62+i*r*2.7;if(g.fire>0)g.fire-=FRAME_DT;
    ctx.save();if(g.fire>0){ctx.globalCompositeOperation='lighter';const gl=glow('255,230,150');if(gl)ctx.drawImage(gl,x-r*2.2,y-r*2.2,r*4.4,r*4.4);ctx.globalCompositeOperation='source-over'}
    ctx.fillStyle='#1c140e';ctx.strokeStyle=G.col;ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,r,0,6.283);ctx.fill();ctx.stroke();
    if(G.cd&&B){const p=1-clamp(g.t/(G.cd*(1-.05*(g.l-1))),0,1);ctx.strokeStyle=hexA(G.col,.9);ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y,r+3,-1.571,-1.571+p*6.283);ctx.stroke()}
    drawIcon(G.icn,x,y,r*1.35,G.col);ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillStyle='#fff';ctx.font=`800 ${Math.max(8,r*.7)}px "Barlow Condensed",sans-serif`;ctx.fillText(g.l,x+r*.85,y+r*.8);ctx.restore()});
  if(B&&B.sent&&B.sent.hp>0){const f=frame('m_golem',160,0,ss(T*1.2)*DPR),x=sx(FW-T*.05),y=sy(keepPos().y)+ss(T*.35),s=ss(T*1.2);if(f){ctx.save();ctx.translate(x,y);ctx.scale(-1,1);ctx.drawImage(f,-s/2,-s*.86,s,s);ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.25;ctx.drawImage(f,-s/2,-s*.86,s,s);ctx.restore()}
    const bw=ss(T*.8),p=B.sent.hp/B.sent.max;ctx.fillStyle='rgba(0,0,0,.7)';ctx.fillRect(x-bw/2,y-s*.95,bw,ss(5));ctx.fillStyle='#b8c2cc';ctx.fillRect(x-bw/2,y-s*.95,bw*p,ss(5))}}
function drawTimeStop(){const B=R.b;if(!B||!(B.ts>0))return;ctx.save();ctx.globalAlpha=Math.min(.28,B.ts*.3);ctx.fillStyle='#4ab8ff';ctx.fillRect(0,0,W,H);ctx.globalAlpha=Math.min(1,B.ts);ctx.strokeStyle='#bff0ff';ctx.lineWidth=3;const cx=sx(FW/2),cy=sy(FH/2),r=ss(T*1.2);ctx.beginPath();ctx.arc(cx,cy,r,0,6.283);ctx.stroke();ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.cos(TIME*.2)*r*.8,cy+Math.sin(TIME*.2)*r*.8);ctx.moveTo(cx,cy);ctx.lineTo(cx,cy-r*.55);ctx.stroke();ctx.restore()}
