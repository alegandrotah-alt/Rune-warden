// ---------- guided first run: coach bubbles that point at what to do next ----------
let TUT=null;
const rectOf=el=>{const e=$(el);if(!e||!e.getBoundingClientRect)return null;const r=e.getBoundingClientRect();return{l:r.left,t:r.top,r:r.right,b:r.bottom}};
const fieldRect=()=>({l:sx(0),t:sy(0),r:sx(FW),b:sy(FH)});
const tileRect=(c,r)=>({l:sx(c*T)-4,t:sy(r*T)-ss(T)*.55,r:sx((c+1)*T)+4,b:sy((r+1)*T)+4});
function tutTile(){const rt=R.field.route||[];for(let i=Math.floor(rt.length*.35);i<rt.length;i++){const [c,r]=rt[i];for(const [dc,dr] of [[0,-1],[0,1]]){const cc=c+dc,rr=r+dr;if(rr>=0&&rr<ROWS&&canPlace(cc,rr)&&!heroAt(cc,rr))return[cc,rr]}}return[5,2]}
const TUTS=[
  {id:'buy',txt:'Welcome, Warden! Monsters will march from the portal on the left to your castle on the right. First, <b>tap a hero card</b> in the shop to buy it. It goes to your bench under the field.',tg:()=>rectOf('cards'),done:()=>allHeroes().length>=2},
  {id:'place',txt:'Now <b>drag a hero from your bench onto the field</b>. At level 2 you can field 2 heroes, so place both.',tg:()=>{const i=R.bench.findIndex(Boolean);if(i<0)return fieldRect();const b=benchSlot(i);return{l:b.x-b.w*.5,t:b.y-b.w*.6,r:b.x+b.w*.5,b:b.y+b.w*.5}},hand:1,done:()=>R.board.length>=Math.min(2,boardMax())||!R.bench.some(Boolean)},
  {id:'road',txt:'Heroes block their tile, so <b>your heroes are the maze</b>. The dashed line is the road monsters will take: bend it so they walk past your heroes for longer. You can never close it completely.',tg:fieldRect,ok:1},
  {id:'fight',txt:'Ready? Press <b>FIGHT!</b> to send the first wave. Use the same button to speed the battle up.',tg:()=>rectOf('fightB'),done:()=>R.phase==='wave'},
  {id:'mana',txt:'Heroes attack on their own. Under each hero, the <b>blue bar</b> is mana: when it fills, the hero casts a spell. The <b>green bar</b> is health: monsters hit heroes they pass, and a knocked-out hero sits out until the wave ends.',tg:fieldRect,wave:1,auto:9},
  {id:'income',txt:'Every wave pays gold, plus <b>1 interest for every 10 gold you keep</b> (up to 5). <b>Buy XP</b> to level up: you field more heroes and find rarer ones.',tg:()=>rectOf('goldT'),ok:1,plan:1},
  {id:'map',txt:'Before every wave you <b>pick the next stop on the act map</b> (the ⚑ button). Elite battles drop items, shrines give rune stones, camps repair the keep, and mystery stops are... a mystery.',tg:()=>rectOf('mapB'),ok:1,plan:1},
  {id:'merge',txt:'<b>Three copies</b> of the same hero merge into a much stronger <b>★2</b>, and three ★2 into ★3. A glowing card in the shop completes a pair.',tg:()=>rectOf('cards'),ok:1,plan:1},
  {id:'runes',txt:'Shots that fly over a blue <b>× rune</b> are multiplied. Monsters that walk through a purple <b>× portal</b> split into copies, and every copy drops gold. Route them through for profit, or around for safety.',tg:()=>{const q=R.field.runes[0];return q?tileRect(q.c,q.r):fieldRect()},ok:1,plan:1},
  {id:'traits',txt:'Different heroes that share a <b>trait</b> power it up. Tap a trait on the left to see what it does and who has it. The <b>▤</b> button shows how much damage each hero dealt. Good luck!',tg:()=>rectOf('traits'),ok:1,plan:1},
];
function tutStart(){if(!DOM||META.tut)return;TUT={i:0,t:0};$('coach').hidden=false;tutShow()}
function tutEnd(skip){TUT=null;META.tut=1;saveMeta();if(DOM){$('coach').hidden=true;$('coachRing').hidden=true}if(!skip)toast('Tutorial complete')}
function tutShow(){const s=TUTS[TUT.i];$('coachT').innerHTML=s.txt;$('coachOk').hidden=!s.ok;TUT.t=0;TUT.tile=s.hand?tutTile():null}
function tutNext(){TUT.i++;if(TUT.i>=TUTS.length){tutEnd();return}tutShow()}
function tutTick(dt){if(!TUT||!DOM)return;const s=TUTS[TUT.i],co=$('coach'),ring=$('coachRing');
  const blocked=!$('ovStart').hidden||!$('ovPick').hidden||!$('ovEnd').hidden||!$('ovMap').hidden||!$('ovEvent').hidden||PAUSED,wrongPhase=s.wave&&R.phase!=='wave'||s.plan&&R.phase!=='plan';
  if(s.wave&&R.phase!=='wave'&&TUT.t>0){tutNext();return}
  co.hidden=blocked||wrongPhase;ring.hidden=co.hidden;if(co.hidden)return;
  TUT.t+=dt;if(s.done&&s.done()){tutNext();return}if(s.auto&&TUT.t>s.auto){tutNext();return}
  const r=s.tg();if(!r){ring.hidden=true;return}
  const key=[r.l,r.t,r.r,r.b].map(Math.round).join();if(key!==TUT.rk){TUT.rk=key;Object.assign(ring.style,{left:(r.l-6)+'px',top:(r.t-6)+'px',width:(r.r-r.l+12)+'px',height:(r.b-r.t+12)+'px'})}
  // bubble beside the target, kept on screen
  const bw=co.offsetWidth||300,bh=co.offsetHeight||120;let x=clamp((r.l+r.r)/2-bw/2,8,W-bw-8),y=r.t-bh-14;if(r.t>H*.55&&s.hand)y=44;if(y<44)y=r.b+14;if(y+bh>H-4)y=clamp(H/2-bh/2,44,H-bh-4);
  if(r.b-r.t>H*.5){y=60;x=clamp(r.r-bw-10,8,W-bw-8)}
  const k2=Math.round(x)+','+Math.round(y);if(k2!==TUT.ck){TUT.ck=k2;co.style.left=x+'px';co.style.top=y+'px'}}
// a ghost hand that shows the drag from bench to field
function drawTutHand(){if(!TUT||!TUTS[TUT.i].hand||!TUT.tile||R.phase!=='plan')return;const i=R.bench.findIndex(Boolean);if(i<0)return;const a=benchSlot(i),c=TUT.tile,bx=sx((c[0]+.5)*T),by=sy((c[1]+.5)*T);
  const p=(TIME*.6)%1,e=p<.15?0:p>.85?1:(p-.15)/.7,x=a.x+(bx-a.x)*e,y=a.y+(by-a.y)*e;
  ctx.save();ctx.globalAlpha=p>.9?(1-p)*10:1;ctx.strokeStyle='#ffd76a';ctx.lineWidth=3;ctx.setLineDash([6,6]);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(bx,by);ctx.stroke();ctx.setLineDash([]);
  ctx.strokeRect(bx-ss(T)*.45,by-ss(T)*VY*.45,ss(T)*.9,ss(T)*VY*.9);
  ctx.fillStyle='#fff8e0';ctx.strokeStyle='#1a0d04';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,11,0,6.283);ctx.fill();ctx.stroke();ctx.fillStyle='#1a0d04';ctx.font='900 13px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('☝',x,y+1);ctx.restore()}
function bindTut(){if(!DOM)return;$('coachOk').addEventListener('click',()=>{if(TUT)tutNext()});$('coachSkip').addEventListener('click',()=>tutEnd(true))}
