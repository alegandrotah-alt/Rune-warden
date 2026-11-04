// ---------- sound: Kenney CC0 effects and a looping orchestral soundtrack ----------
let AC=null,MUSMODE='menu';const SB={},SLAST={};
function ensureAudio(){if(typeof window==='undefined')return;if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)()}catch(e){return}
    for(const k in SFXDATA){const bin=atob(SFXDATA[k]),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);try{const p=AC.decodeAudioData(u.buffer,b=>{SB[k]=b},()=>{});if(p&&p.catch)p.catch(()=>{})}catch(e){}}}
  if(AC.state==='suspended')AC.resume()}
function sfx(k,vol,rate){if(!AC||!SET.sfx||!SB[k])return false;const now=AC.currentTime;if(now-(SLAST[k]||0)<.045)return true;SLAST[k]=now;
  const s=AC.createBufferSource(),g=AC.createGain();s.buffer=SB[k];s.playbackRate.value=rate||1;g.gain.value=(vol??.5)*SET.sfx;s.connect(g).connect(AC.destination);s.start();return true}
const OST={tracks:{menu:{f:'menu'},act1:{f:'act1'},act2:{f:'act2'},act3:{f:'act3'},boss:{f:'boss',xf:4.5}},buf:{},ld:{},fail:{},cur:null,gain:null};
function ostLoad(k){if(OST.buf[k]||OST.ld[k]||OST.fail[k]||!AC||typeof fetch==='undefined')return;OST.ld[k]=1;
  fetch('music/'+OST.tracks[k].f+'.mp3').then(r=>{if(!r.ok)throw 0;return r.arrayBuffer()}).then(a=>new Promise((res,rej)=>{const p=AC.decodeAudioData(a,res,rej);if(p&&p.then)p.then(res,rej)}))
    .then(b=>{const d=b.getChannelData(0),n=d.length;let s=0,e=n-1;while(s<n&&Math.abs(d[s])<2e-4)s++;while(e>s&&Math.abs(d[e])<2e-4)e--;OST.buf[k]={b,ls:s/b.sampleRate,le:(e+1)/b.sampleRate}}).catch(()=>{OST.fail[k]=1})}
function ostStart(k,fade){const T0=OST.buf[k],t=AC.currentTime,src=AC.createBufferSource(),g=AC.createGain();src.buffer=T0.b;if(!OST.tracks[k].xf){src.loop=true;src.loopStart=T0.ls;src.loopEnd=T0.le}
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(1,t+fade);src.connect(g).connect(OST.gain);src.start(t,T0.ls);return{k,src,g,end:t+(T0.le-T0.ls)}}
function ostStop(c,fade){if(!c)return;const t=AC.currentTime;try{c.g.gain.cancelScheduledValues(t);c.g.gain.setValueAtTime(c.g.gain.value,t);c.g.gain.linearRampToValueAtTime(0,t+fade);c.src.stop(t+fade+.05)}catch(e){}}
function musicTick(){if(!AC)return;if(!OST.gain){OST.gain=AC.createGain();OST.gain.gain.value=0;OST.gain.connect(AC.destination)}
  const want=MUSMODE==='menu'||!R?'menu':(R.wave%10===0&&R.wave<=30&&R.phase==='wave')?'boss':'act'+(R.act+1);ostLoad(want);
  // decoded music is big, so only the playing track and the one likely next are kept in memory
  const nx=MUSMODE==='menu'||!R?'act1':R.wave%10>=8||R.wave%10===0?'boss':'act'+(R.act+1);if(OST.buf[want])ostLoad(nx);
  for(const k in OST.buf)if(OST.buf[k]&&k!==want&&k!==nx&&!(OST.cur&&OST.cur.k===k)){delete OST.buf[k];OST.ld[k]=0}
  OST.gain.gain.setTargetAtTime(SET.music*(PAUSED?.3:MUSMODE==='menu'?.6:R&&R.phase==='wave'?.75:.5),AC.currentTime,.3);
  if(!OST.buf[want])return;const t=AC.currentTime;
  if(!OST.cur||OST.cur.k!==want){if(OST.cur)ostStop(OST.cur,1.5);OST.cur=ostStart(want,OST.cur?1.5:.8)}
  else if(OST.tracks[want].xf&&t>OST.cur.end-OST.tracks[want].xf){ostStop(OST.cur,OST.tracks[want].xf);OST.cur=ostStart(want,1.2)}}
if(typeof document!=='undefined'&&document.addEventListener)document.addEventListener('visibilitychange',()=>{if(!AC)return;try{if(document.hidden)AC.suspend();else AC.resume()}catch(e){}});
