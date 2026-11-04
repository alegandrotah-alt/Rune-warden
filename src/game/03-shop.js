// ---------- shop, gold, levels ----------
function rollTier(){const o=ODDS[Math.min(10,R.lvl)];let x=rng()*100;for(let t=0;t<5;t++){x-=o[t];if(x<0)return t+1}return 1}
function rollShop(free){
  for(const k of R.shop)if(k)R.pool[k]++;
  R.shop=[];for(let i=0;i<5;i++){let t=rollTier(),opts=[];for(;t>=1;t--){opts=HKEYS.filter(k=>HEROES[k].c===t&&R.pool[k]>0);if(opts.length)break}
    // weight by copies left, like a shared pool
    let tot=opts.reduce((a,k)=>a+R.pool[k],0),x=rng()*tot,pick=opts[0];for(const k of opts){x-=R.pool[k];if(x<0){pick=k;break}}
    if(pick){R.pool[pick]--;R.shop.push(pick)}else R.shop.push(null)}
  if(!free)R.rerolls++}
const rerollCost=()=>R.freeRoll>0?0:(has('cheap')?1:2)+(has('crown')?1:0);
function reroll(){const c=rerollCost();if(R.gold<c)return false;R.gold-=c;if(R.freeRoll>0)R.freeRoll--;rollShop();sfx('click',.5);return true}
function buy(i){const k=R.shop[i];if(!k)return false;const c=HEROES[k].c;if(R.gold<c)return false;R.pool[k]++;if(!addHero(k,1))return false;R.gold-=c;R.shop[i]=null;sfx('pick',.55);return true}
function buyXP(){if(R.gold<4||R.lvl>=10)return false;R.gold-=4;gainXP(4);sfx('click',.5);return true}
function gainXP(n){R.xp+=n;while(R.lvl<10&&R.xp>=XPNEED[R.lvl]){R.xp-=XPNEED[R.lvl];R.lvl++;sfx('level',.6);floatText(FW/2,FH/2,'LEVEL '+R.lvl,'#ffd76a',1.4);if(R.lvl>=9)award('lvl9')}if(R.lvl>=10)R.xp=0}
const interestCap=()=>asc(8)?4:has('richer')?8:rank('interest')?6:5;
function income(won){
  const base=5,int=has('ecto')?0:Math.min(interestCap(),Math.floor(R.gold/10)),st=Math.abs(R.streak)>=5?3:Math.abs(R.streak)>=4?2:Math.abs(R.streak)>=2?1:0,ex=(has('tithe')?2:0);
  R.gold+=base+int+st+ex;return{base,int,st,ex}}
