// ---------- main loop ----------
let LAST=0,FRAME_DT=1/60,HINT=0;
function step(dt){if(!R||PAUSED)return;if(R.phase==='wave'&&R.b){let left=Math.min(.25,dt)*R.speed;while(left>0){const d=Math.min(1/30,left);left-=d;battleTick(d);if(!R.b||R.phase!=='wave')break}}
  if(DOM&&!TUT&&R.phase==='plan'&&$('ovStart').hidden){HINT-=dt;if(HINT<=0){HINT=9;if(R.items&&R.items.length&&!META.itemHint){META.itemHint=1;saveMeta();toast('You found an item! Drag it from beside the bench onto a hero. Tap it to read what it does.')}else if(!R.board.length)toast('Drag a hero from your bench onto the field, then press FIGHT');else if(R.board.length<boardMax()&&R.bench.some(Boolean)&&R.wave<4)toast(`You can field ${boardMax()} heroes. Drag more onto the field`)}}}
function loop(now){const dt=Math.min(.1,(now-LAST)/1000||1/60);LAST=now;FRAME_DT=dt;
  PERF.acc+=dt;PERF.n++;if(PERF.n>=180){if(PERF.acc/PERF.n>.03&&!PERF.low){PERF.low=true;resize()}PERF.acc=0;PERF.n=0}
  step(dt);musicTick();if(R)render(dt);tutTick(dt);
  if(DOM&&R&&R.phase==='wave'&&((now/250)|0)!==loop.k){loop.k=(now/250)|0;uiRefresh()}
  requestAnimationFrame(loop)}
function init(){bindUI();measure();resize();newRun();for(const k of HKEYS)sheet('h_'+k);sheet('keep');sheet('props');sheet('props2');const sk=SKINS.find(q=>q.id===SET.skin);if(sk)sheet(sk.sh);showStart();uiRefresh();requestAnimationFrame(loop);
  if(typeof location!=='undefined'&&/debug/.test(location.search))window.__RW={get R(){return R},newRun,startWave,buy,reroll,buyXP,placeHero,addHero,takeRelic,genField,uiRefresh,calcTraits,canPlace,heroAt,offerRelics,set speed(v){R.speed=v},get SYN(){return SYN},benchSlot,tileXY:(c,r)=>({x:sx((c+.5)*T),y:sy((r+.5)*T)}),stoneSlot,itemSlot,dropItem,equipFrom,chooseNode,mapOptions,needMap,showMap,startEvent,resolveEvent,genMap,startGame,get META(){return META}}}
if(DOM)init();
})();
