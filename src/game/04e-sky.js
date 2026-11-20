// ---------- sky finds: rewards floating off the island ----------
// Each island has a few finds hanging in the open sky a hex or three from its edge. Raising land (Expand) onto
// a find claims it, so the land you buy has a purpose: gold, an item part, a rune stone, a ley hex that
// powers up the hero on it, or a rift anchor that opens a new gate (more monsters, better pay).
const SKYF={
  cache:{n:'Floating cache',ic:'chest',col:'#ffcf6a',d:f=>`Raise land onto it to claim ${f.v} gold.`},
  forge:{n:'Sky forge',ic:'sword',col:'#ffb070',d:()=>'Raise land onto it to claim an item part.'},
  stone:{n:'Fallen rune stone',ic:'rune',col:'#9cc4ff',d:()=>'Raise land onto it to claim a ×2 rune stone for your rack.'},
  shrine:{n:'Ley shrine',ic:'star',col:'#7ff0e0',d:()=>'Raise land onto it and it becomes a ley hex for the rest of the act: the hero standing there deals 40% more damage and its spells hit 25% harder.'},
  anchor:{n:'Rift anchor',ic:'eye',col:'#c890ff',d:()=>'Raise land onto it to open a new gate for the rest of the act. More monsters come, but every fight pays 6 extra gold and the act boss gives 2 extra star points.'},
};
function genSky(F){F.sky=[];F.ley=[];F.anchor=0;if(!F.land)return;
  // how far each sky hex is from the island, walking through open sky
  const d=new Int8Array(COLS*ROWS).fill(-1),q=[];for(let i=0;i<COLS*ROWS;i++)if(F.land[i]){d[i]=0;q.push(i)}
  for(let h=0;h<q.length;h++){const i=q[h];for(const [c,r] of nbrs(i%COLS,(i/COLS)|0)){const j=r*COLS+c;if(d[j]<0){d[j]=d[i]+1;q.push(j)}}}
  const pick=(k,dmin,dmax,cmax)=>{const o=[];for(let i=0;i<COLS*ROWS;i++){const c=i%COLS,r=(i/COLS)|0;if(d[i]>=dmin&&d[i]<=dmax&&c>=1&&c<=cmax&&!F.sky.some(s=>Math.abs(s.c-c)+Math.abs(s.r-r)<3))o.push([c,r,d[i]])}
    if(!o.length)return;const [c,r,dd]=o[(rng()*o.length)|0];F.sky.push({k,c,r,d:dd,v:k==='cache'?6+R.act*3+dd*3:0})};
  // an anchor is a gate, so it keeps to the far half of the field like every other gate
  if(R.act>=1||R.endless)pick('anchor',1,3,7);
  pick('cache',1,2,COLS-2);pick('cache',2,3,COLS-2);pick(rng()<.5?'forge':'stone',2,3,COLS-2);pick('shrine',1,3,COLS-3)}
const skyAt=(c,r)=>(R.field.sky||[]).find(s=>!s.got&&s.c===c&&s.r===r);
const isLey=(c,r)=>!!(R.field&&R.field.ley&&R.field.ley.some(q=>q.c===c&&q.r===r));
function skyClaim(s){const F=R.field,x=hx(s.c,s.r),y=hy(s.r),ft=(t,col)=>{if(typeof floatText==='function')floatText(x,y-T*.4,t,col,1.2)};s.got=1;R.stats.finds=(R.stats.finds||0)+1;
  if(s.k==='cache'){R.gold+=s.v;ft('+'+s.v+' gold','#ffcf2e')}
  else if(s.k==='forge'){const id=rndS(COMPS);stashItem(id);ft(ITEMS[id].n,'#ffb070')}
  else if(s.k==='stone'){R.stones.push(2);ft('Rune stone ×2','#9cc4ff')}
  else if(s.k==='shrine'){F.ley.push({c:s.c,r:s.r});ft('Ley hex','#7ff0e0')}
  else if(s.k==='anchor'){F.gates.push({k:'anchor',c:s.c,r:s.r,id:F.gates.length});F.anchor=1;rebuildBlk();fixRoads();R.nextQ=anchorQ(R.nextQ);if(typeof banner==='function')banner('A RIFT ANCHOR OPENS','#c890ff')}
  if(typeof sfx==='function')sfx(s.k==='anchor'?'elite':'coin',.6);if(R.stats.finds>=10)award('finds')}
// an open anchor sends its own pack on top of the wave: about a third more monsters
function anchorQ(q){const F=R.field,an=F&&F.gates&&F.gates.find(g=>g.k==='anchor');if(!q||!an||q.some(e=>e.an))return q;
  const n=Math.ceil(q.filter(e=>!(MON[e.k]&&MON[e.k].boss)).length*.3),ro=actD(R.final?3:R.act).roster;
  for(let i=0;i<n;i++)q.splice(1+((rng()*q.length)|0),0,{k:rndS(ro),g:an.id,an:1});return q}
