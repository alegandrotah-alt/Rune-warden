// ---------- the act map: before every wave you pick where the road goes next ----------
const NODE_W=[['battle',38],['elite',14],['shrine',10],['treasure',12],['camp',10],['mystery',16]];
function rollNode(row,taken){let tot=0;const opts=NODE_W.filter(([k])=>!(k==='elite'&&(row<2||taken.includes('elite')))&&!(k==='camp'&&(row<3||taken.includes('camp')))&&!(k==='treasure'&&taken.includes('treasure')));
  for(const o of opts)tot+=o[1];let x=rng()*tot;for(const [k,w] of opts){x-=w;if(x<0)return k}return 'battle'}
function genMap(){if(R.endless||R.wave>30){R.map=null;R.node='battle';return}const rows=[];
  for(let i=0;i<9;i++){const row=[];if(i===0&&R.act===0){rows.push([null,'battle',null]);continue}for(let l=0;l<3;l++)row.push(i===0?(l===1?'battle':rng()<.5?'shrine':'battle'):rollNode(i,row));if(!row.includes('battle')&&i>0)row[(rng()*3)|0]='battle';rows.push(row)}
  rows.push([null,'boss',null]);R.map={act:R.act,rows,pos:null,next:null};R.node=null}
const mapRow=()=>(R.wave-1)%10;
function mapOptions(){const M=R.map;if(!M||R.endless)return[];const row=mapRow();if(row>9||!M.rows[row])return[];
  let lanes=M.pos&&M.pos.row===row-1?[M.pos.lane-1,M.pos.lane,M.pos.lane+1]:[0,1,2];lanes=lanes.filter(l=>l>=0&&l<3&&M.rows[row][l]);if(!lanes.length)lanes=[0,1,2].filter(l=>M.rows[row][l]);return lanes.map(lane=>({row,lane}))}
const needMap=()=>!!(R&&R.map&&!R.map.next&&R.phase==='plan'&&mapOptions().length>1);
function chooseNode(row,lane){const M=R.map;if(!M)return;M.next={row,lane};R.node=M.rows[row][lane];R.nextQ=nodeQ(waveList(R.wave));
  if(R.node==='mystery')startEvent();sfx('pick',.5);saveRun()}
// a map-less wave (endless) or the only road left is taken automatically
function autoNode(){if(!R.map){R.node='battle';return}const o=mapOptions();if(o.length===1&&!R.map.next)chooseNode(o[0].row,o[0].lane)}
function mapEnter(){if(!R.map)return;if(!R.map.next){const o=mapOptions();if(o.length){const b=o.find(q=>R.map.rows[q.row][q.lane]==='battle')||o[0];R.map.next=b;R.node=R.map.rows[b.row][b.lane];R.nextQ=nodeQ(R.nextQ&&R.nextQ.length?R.nextQ:waveList(R.wave))}}R.map.pos=R.map.next;R.map.next=null}
// how the chosen stop changes the coming wave
function nodeQ(q){q=q.slice();const n=R.node;
  if(n==='elite'){for(let i=0,t=0;i<2&&t<40;t++){const e=q[(rng()*q.length)|0];if(!e.elite&&!MON[e.k].boss){e.elite=1;i++}}}
  else if(n==='shrine')q=q.filter((e,i)=>MON[e.k].boss||i%10>=3);
  else if(n==='treasure'){const add=Math.round(q.length*.3);for(let i=0;i<add;i++)q.splice((rng()*q.length)|0,0,{k:q[(rng()*q.length)|0].k})}
  else if(n==='camp')q=q.filter((e,i)=>e.elite||MON[e.k].big||i%2===0);
  return q}
// rewards for the stop you just cleared
function nodeReward(won){const n=R.node;
  if(n==='elite'&&won){R.stats.elites=(R.stats.elites||0)+1;if(R.stats.elites>=5)award('elite5');dropItem(rndS(COMPS));R.gold+=3;toast('Elite battle won: an item component and 3 gold')}
  else if(n==='elite')toast('Monsters broke through: no elite reward');
  if(n==='shrine'){R.stones.push(2);toast('The shrine gives you a ×2 rune stone')}
  if(n==='camp'){const h=Math.min(15,R.hpMax-R.hp);R.hp+=h;if(h>0)toast(`The camp repairs ${h} keep health`)}}
// ---------- mystery events ----------
const EVENTS={
  armory:{t:'An abandoned armory',d:'Racks of old gear, most of it rusted. A few pieces are still good. Take one.',mk:()=>({c:[rndS(COMPS),rndS(COMPS),rndS(COMPS)]}),opts:e=>e.c.map(c=>({n:'Take the '+ITEMS[c].n,d:ITEMS[c].d,run:()=>dropItem(c)}))},
  well:{t:'A cursed well',d:'Something glints at the bottom of the well. The water whispers your name.',opts:()=>[{n:'Reach in',d:'Lose 15 keep health. Gain two item components.',ok:()=>R.hp>15,run:()=>{R.hp-=15;dropItem(rndS(COMPS));dropItem(rndS(COMPS))}},{n:'Walk away',d:'Nothing happens.',run:()=>{}}]},
  merchant:{t:'A travelling merchant',d:'"Fine wares for a fine warden. Gold first, of course."',opts:()=>[{n:'Buy a component',d:'6 gold for a random item component.',ok:()=>R.gold>=6,run:()=>{R.gold-=6;dropItem(rndS(COMPS))}},{n:'Buy a finished item',d:'14 gold for a random finished item.',ok:()=>R.gold>=14,run:()=>{R.gold-=14;dropItem(randomFinished())}},{n:'Leave',d:'Keep your gold.',run:()=>{}}]},
  pilgrim:{t:'A rune pilgrim',d:'An old woman covered in glowing tattoos offers you a blessing.',opts:()=>[{n:'A rune stone',d:'Gain a ×2 rune stone.',run:()=>R.stones.push(2)},{n:'Bless the runes',d:'Every rune on the field multiplies by 1 more for the rest of this act.',run:()=>{for(const q of R.field.runes)q.v++}}]},
  gambler:{t:'A goblin gambler',d:'"Double or nothing, warden? Well, more or less double."',opts:()=>[{n:'Bet 10 gold',d:'Half the time you win 25 gold back.',ok:()=>R.gold>=10,run:()=>{R.gold-=10;if(rng()<.5){R.gold+=25;toast('You win 25 gold!');sfx('coin',.6)}else toast('The goblin cackles and pockets your gold')}},{n:'Leave',d:'Keep your gold.',run:()=>{}}]},
  drill:{t:'A veteran drillmaster',d:'"Your recruits are soft. Give me an afternoon."',opts:()=>[{n:'Train',d:'Gain 6 XP.',run:()=>gainXP(6)},{n:'Recruit',d:'Pay 3 gold: a free copy of a random hero you own.',ok:()=>R.gold>=3&&allHeroes().length>0,run:()=>{R.gold-=3;const h=rndS(allHeroes());if(!addHero(h.k,1,true))R.gold+=3}}]},
};
const EVKEYS=Object.keys(EVENTS);
function startEvent(){const id=rndS(EVKEYS),E=EVENTS[id];R.event=Object.assign({id},E.mk?E.mk():{});showEvent()}
function eventOpts(){const E=EVENTS[R.event.id];return E.opts(R.event)}
function resolveEvent(i){const o=eventOpts()[i];if(!o||o.ok&&!o.ok())return false;R.event=null;o.run();calcTraits();saveRun();if(DOM){$('ovEvent').hidden=true;uiRefresh()}return true}
// ---------- map and event screens ----------
function showEvent(){if(!DOM||!R.event)return;const E=EVENTS[R.event.id];$('evT').textContent=E.t;$('evD').textContent=E.d;const box=$('evList');box.innerHTML='';
  eventOpts().forEach((o,i)=>{const b=document.createElement('button');b.type='button';b.className='relic';b.style.setProperty('--c','#d6a8ff');b.disabled=!!(o.ok&&!o.ok());b.innerHTML=`<b>${o.n}</b><span>${o.d}</span>`;b.addEventListener('click',()=>resolveEvent(i));box.appendChild(b)});
  $('ovEvent').hidden=false}
function showMap(){if(!DOM||!R.map)return;const M=R.map,box=$('mapGrid');box.innerHTML='';const opts=mapOptions(),pick=!M.next&&R.phase==='plan';
  $('mapT').textContent=`Act ${['I','II','III'][R.act]} · ${ACTS[R.act].n}`;$('mapS').textContent=pick&&opts.length>1?'Choose where the road goes next. Each stop changes the coming wave.':M.next?`Next: ${NODES[R.node].n}. ${NODES[R.node].d}`:'Your route through this act.';
  const cur=mapRow();
  for(let l=0;l<3;l++)for(let r=0;r<10;r++){const t=M.rows[r][l],b=document.createElement('button');b.type='button';if(!t){b.className='mn none';b.disabled=true;box.appendChild(b);continue}
    const N=NODES[t],can=pick&&opts.some(o=>o.row===r&&o.lane===l),was=M.pos&&M.pos.row===r&&M.pos.lane===l,nx=M.next&&M.next.row===r&&M.next.lane===l;
    b.className='mn'+(can?' can':'')+(was?' was':'')+(nx?' nx':'')+(r<cur&&!was?' past':'')+(t==='boss'?' boss':'');b.style.setProperty('--c',N.col);b.style.gridColumn=r+1;b.style.gridRow=l+1;
    b.innerHTML=`<i>${N.ic}</i><small>${N.n}</small>`;b.title=N.d;b.disabled=!can;if(can)b.addEventListener('click',()=>{chooseNode(r,l);$('ovMap').hidden=true;uiRefresh()});box.appendChild(b)}
  $('mapClose').hidden=pick&&opts.length>1;$('ovMap').hidden=false}
function bindMap(){if(!DOM)return;$('mapB').addEventListener('click',()=>{if(R&&R.map)showMap()});$('mapClose').addEventListener('click',()=>{$('ovMap').hidden=true})}
