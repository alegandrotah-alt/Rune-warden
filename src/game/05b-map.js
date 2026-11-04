// ---------- the act map: branching roads of rooms, ten floors per act, the boss at the end ----------
// Every floor is a round of the auto-battler (income, XP, a fresh shop). Fights spawn a wave; other rooms don't.
const MAPF=10,MAPL=5;
const isFight=t=>!!(NODES[t]&&NODES[t].fight);
const MAP_W=[['battle',44],['event',20],['elite',15],['rest',10],['merchant',8],['treasure',3]];
function pickType(f,parents){
  if(f===0)return 'battle';if(f===MAPF-2)return 'rest';if(f===5)return 'treasure';
  const opts=MAP_W.filter(([k])=>!(stage()<1&&(k==='event'||k==='merchant'))&&!(k==='elite'&&f<3)&&!(k==='rest'&&f<4)&&!(k==='merchant'&&f<2)&&!(k==='treasure'&&f<3)&&!(['elite','rest','merchant','treasure'].includes(k)&&parents.includes(k)));
  let tot=0;for(const o of opts)tot+=o[1];let x=rng()*tot;for(const [k,w] of opts){x-=w;if(x<0)return k}return 'battle'}
function genMap(){if(R.endless||R.wave>30){R.map=null;R.node='battle';return}
  const N=[];for(let f=0;f<MAPF;f++)N.push(new Array(MAPL).fill(null));
  const edges=[];const cross=(f,a,b)=>edges.some(e=>e.f===f&&(e.a-a)*(e.b-b)<0);
  const starts=R.act===0?[2,2,2,2]:[rng()*MAPL|0,rng()*MAPL|0,rng()*MAPL|0,rng()*MAPL|0];if(R.act>0&&new Set(starts).size<2)starts[0]=(starts[1]+2)%MAPL;
  for(const s0 of starts){let l=s0;for(let f=0;f<MAPF-1;f++){N[f][l]=N[f][l]||{nx:[]};if(f===MAPF-2){if(!N[f][l].nx.includes(2))N[f][l].nx.push(2);break}
    let nl=clamp(l+((rng()*3|0)-1),0,MAPL-1);if(cross(f,l,nl))nl=l;if(!N[f][l].nx.includes(nl)){N[f][l].nx.push(nl);edges.push({f,a:l,b:nl})}l=nl}}
  N[MAPF-1][2]={nx:[],t:'boss'};
  for(let f=0;f<MAPF-1;f++)for(let l=0;l<MAPL;l++){const n=N[f][l];if(!n)continue;const par=[];if(f>0)for(let k=0;k<MAPL;k++){const p=N[f-1][k];if(p&&p.nx.includes(l))par.push(p.t)}n.t=pickType(f,par)}
  // every act has at least one elite to hunt
  if(!N.some(row=>row.some(n=>n&&n.t==='elite'))){const c=[];for(let f=3;f<8;f++)for(let l=0;l<MAPL;l++)if(N[f][l]&&N[f][l].t==='battle')c.push(N[f][l]);if(c.length)rndS(c).t='elite'}
  R.map={act:R.act,nodes:N,pos:null,next:null,seen:[]};R.node=null}
const mapFloor=()=>(R.wave-1)%MAPF;
function mapOptions(){const M=R.map;if(!M||!M.nodes||R.endless)return[];const f=mapFloor(),row=M.nodes[f];if(!row)return[];
  let ls=M.pos&&M.pos.f===f-1&&M.nodes[f-1][M.pos.l]?M.nodes[f-1][M.pos.l].nx.slice():row.map((n,l)=>n?l:-1).filter(l=>l>=0);
  return ls.filter(l=>row[l]).map(l=>({f,l,t:row[l].t}))}
// the map must be opened when there is a real choice, or the only road leads to a room without monsters
function needMap(){if(!R||!R.map||R.phase!=='plan'||R.map.next)return false;const o=mapOptions();return o.length>1||o.length===1&&!isFight(o[0].t)}
function autoNode(){if(!R.map){R.node='battle';return}const o=mapOptions();if(o.length===1&&isFight(o[0].t)&&!R.map.next)chooseNode(o[0].f,o[0].l,1)}
function chooseNode(f,l,quiet){const M=R.map;if(!M||R.phase!=='plan'&&!quiet)return false;
  // only a room joined to where you stand, on the current floor, can be chosen
  if(!mapOptions().some(o=>o.f===f&&o.l===l))return false;const t=M.nodes[f][l].t;
  if(!isFight(t)){if(DOM)$('ovMap').hidden=true;M.pos={f,l};M.next=null;R.node=t;M.seen.push(t);enterRoom(t);return}
  M.next={f,l};R.node=t;R.nextQ=nodeQ(waveList(R.wave));if(!quiet)sfx('pick',.5);saveRun()}
function mapEnter(){if(!R.map)return;if(!R.map.next){const o=mapOptions().filter(q=>isFight(q.t));if(o.length){const b=o.find(q=>q.t==='battle')||o[0];R.map.next={f:b.f,l:b.l};R.node=b.t;R.nextQ=nodeQ(R.nextQ&&R.nextQ.length?R.nextQ:waveList(R.wave))}}
  if(R.map.next){R.map.pos=R.map.next;R.map.seen.push(R.node);R.map.next=null}}
// elites bring two champions; a disturbed dragon hoard brings more
function nodeQ(q){q=q.slice();const add=(R.node==='elite'?2:0)+(R.hoard?2:0);
  for(let i=0,t=0;i<add&&t<60;t++){const e=q[(rng()*q.length)|0];if(!e.elite&&!MON[e.k].boss){e.elite=1;i++}}
  return q}
// ---------- the map screen: nodes on a parchment, roads drawn between them ----------
function showMap(){if(!DOM||!R.map||!R.map.nodes)return;const M=R.map,box=$('mapGrid');box.innerHTML='';const opts=R.phase==='plan'?mapOptions():[],cur=mapFloor();
  const pick=opts.length>0&&R.phase==='plan';
  $('mapT').textContent=`Act ${['I','II','III'][R.act]} · ${actD(R.act).n}`;
  $('mapS').textContent=pick?(M.next?`Next: ${NODES[R.node].n}. ${NODES[R.node].d} Tap another room to change your mind.`:'Choose your next room. Only rooms joined to where you stand can be reached.'):'Your road through this act.';
  const X=f=>(f+.5)/MAPF*100,Y=l=>(l+.5)/MAPL*100;let svg=`<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">`;
  for(let f=0;f<MAPF-1;f++)for(let l=0;l<MAPL;l++){const n=M.nodes[f][l];if(!n)continue;for(const b of n.nx){const dest=f===MAPF-2?2:b,live=M.pos&&M.pos.f===f&&M.pos.l===l||(!M.pos&&f===0&&cur===0);
    svg+=`<line x1="${X(f)}" y1="${Y(l)}" x2="${X(f+1)}" y2="${Y(dest)}" class="${f<cur?'old':''}${live?' live':''}"/>`}}
  box.innerHTML=svg+'</svg>';
  for(let f=0;f<MAPF;f++)for(let l=0;l<MAPL;l++){const n=M.nodes[f][l];if(!n)continue;const N=NODES[n.t],can=pick&&opts.some(o=>o.f===f&&o.l===l),here=M.pos&&M.pos.f===f&&M.pos.l===l,nx=M.next&&M.next.f===f&&M.next.l===l;
    const b=document.createElement('button');b.type='button';b.className='mn'+(can?' can':'')+(here?' was':'')+(nx?' nx':'')+(f<cur&&!here?' past':'')+(n.t==='boss'?' boss':'');
    b.style.setProperty('--c',N.col);b.style.left=X(f)+'%';b.style.top=Y(l)+'%';b.innerHTML=`<i>${N.ic}</i><small>${N.n}</small>`;b.title=N.d;b.disabled=!can;
    if(can)b.addEventListener('click',()=>{if(chooseNode(f,l)===false){showMap();return}$('ovMap').hidden=true;uiRefresh()});box.appendChild(b)}
  $('mapLeg').innerHTML=Object.keys(NODES).map(k=>`<span style="--c:${NODES[k].col}"><i>${NODES[k].ic}</i>${NODES[k].n}</span>`).join('');
  $('mapClose').hidden=needMap();$('ovMap').hidden=false}
function bindMap(){if(!DOM)return;$('mapB').addEventListener('click',()=>{if(R&&R.map)showMap()});$('mapClose').addEventListener('click',()=>{$('ovMap').hidden=true})}
