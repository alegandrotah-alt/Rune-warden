// ---------- drawn icons: the same line art in the page (SVG) and on the canvas (Path2D) ----------
// Each icon is a list of 24x24 path strings: plain = stroked line, 'F:' = filled, 'K:' = filled dark (holes, eyes).
const ICON={
  sword:['M5 19L18.5 5.5l1.5-1.5','M7.5 12.5l4 4','M5 19l-2 2','F:M18 4h2v2l-1.5 1.5-2-2z'],
  swords:['M4 4l11 11','M20 4L9 15','M13 17l4-4','M7 13l4 4','M15 15l4 4','M9 15l-4 4'],
  bow:['M6 3c7 2 13 8 15 15','M6 3l15 15','M3 21l11-11','M3 21v-4','M3 21h4'],
  rod:['M5 21l9-9','F:M17 4a3.5 3.5 0 1 1 0 7a3.5 3.5 0 1 1 0-7z','M20 2l1-1','M22 6h1'],
  drop:['F:M12 2C9 7 5.5 10.5 5.5 14.5a6.5 6.5 0 0 0 13 0C18.5 10.5 15 7 12 2z'],
  moon:['F:M14.5 2.5a9.5 9.5 0 1 0 7 15.5a7.5 7.5 0 0 1-7-15.5z'],
  heart:['F:M12 21l-8.2-8.2a5 5 0 0 1 8.2-6 5 5 0 0 1 8.2 6z'],
  skull:['F:M12 2a8 8 0 0 0-8 8c0 3 1.5 5 3 6v4h10v-4c1.5-1 3-3 3-6a8 8 0 0 0-8-8z','K:M7.5 10.5a2 2 0 1 0 4 0a2 2 0 1 0-4 0z','K:M12.5 10.5a2 2 0 1 0 4 0a2 2 0 1 0-4 0z','K:M10 17h1v3h-1zM13 17h1v3h-1z'],
  question:['M8.5 8.5a3.5 3.5 0 1 1 5 3.2c-1.2.6-1.5 1.3-1.5 2.6','F:M10.6 18h2.8v2.8h-2.8z'],
  fire:['F:M12 2c2.5 3.5 6 6 6 10.5a6 6 0 0 1-12 0c0-2.5 1.2-4 2.5-5 0 2 .8 3.5 2.5 4-1-3.5 0-6.5 1-9.5z','M3 21l18-3','M3 18l18 3'],
  scales:['M12 3v17','M7 21h10','M4 7h16','M4 7l-2.5 6h5z','M20 7l-2.5 6h5z','F:M10.5 2h3v3h-3z'],
  chest:['M3 10h18v10H3z','M3 10c0-4 3-6 9-6s9 2 9 6','M3 13.5h18','F:M10.5 12h3v4h-3z'],
  crown:['F:M3 8l4.5 4 4.5-7 4.5 7 4.5-4-2 11H5z'],
  flask:['F:M9 2h6v2h-1v5l5.5 9a2 2 0 0 1-1.7 3H6.2a2 2 0 0 1-1.7-3L10 9V4H9z','K:M7.5 16h9l1.2 2.2a.7.7 0 0 1-.6 1H6.9a.7.7 0 0 1-.6-1z'],
  shield:['F:M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z'],
  leaf:['F:M20 3C9 3 3.5 8.5 3.5 15.5c0 1.2.2 2.3.6 3.3C6 12 11 8.5 15.5 7.5 11 9.8 7 13.8 5.2 20.5 14 21 20 14 20 3z'],
  star:['F:M12 2l2.7 6.5 7 .7-5.3 4.6 1.6 6.9L12 17.1 6 20.7l1.6-6.9L2.3 9.2l7-.7z'],
  daggers:['M5 5l13 13','M19 5L6 18','M3 7l4-4','M17 3l4 4','M15 21l3-3','M9 21l-3-3'],
  bio:['F:M12 9.5a2.5 2.5 0 1 0 0 5a2.5 2.5 0 1 0 0-5z','M12 2.5a5.5 5.5 0 0 1 4.2 9','M12 2.5a5.5 5.5 0 0 0-4.2 9','M4 15.5a5.5 5.5 0 0 0 8.5 5.6','M20 15.5a5.5 5.5 0 0 1-8.5 5.6'],
  arrow:['M4 20L20 4','M20 4h-7','M20 4v7','M4 20l4-1','M4 20l1-4'],
  flag:['M5 22V3','F:M5 3h13l-3.5 4.5L18 12H5z'],
  cross:['F:M10 2.5h4v7h7v4h-7v8h-4v-8H3v-4h7z'],
  boulder:['F:M4.5 16.5c-2-3.5.5-8.5 4.5-9.5 2.5-3 7.5-3 9.5.5 3 1.5 3.5 6 1.5 9-2.5 3.5-12.5 4-15.5 0z'],
  rune:['M8 2.5v19','M8 3.5l8 4.5-8 4.5','M8 12.5l8 9'],
  scythe:['M6 22L14 3','F:M14 3c4.5 0 8 2.5 9 6-3.5-1.5-7-1.5-10 .5z'],
  flame:['F:M12 2c3 4 7 7 7 12.5a7 7 0 0 1-14 0c0-3 2-5 3-6.5 0 2.5 1 4 3 5-1-4 0-7.5 1-11z'],
  hourglass:['M6 2.5h12','M6 21.5h12','M7 2.5c0 6.5 10 6 10 9.5s-10 3-10 9.5','M17 2.5c0 6.5-10 6-10 9.5s10 3 10 9.5'],
  gem:['F:M6 3h12l4 6-10 13L2 9z','K:M2 9h20l-.6.8H2.6z'],
  bars:['M5 20V11','M10 20V5','M15 20V9','M20 20V14','M3 21h19'],
  eye:['M2 12c3-5 6.5-7 10-7s7 2 10 7c-3 5-6.5 7-10 7s-7-2-10-7z','F:M12 8.5a3.5 3.5 0 1 0 0 7a3.5 3.5 0 1 0 0-7z'],
  coin:['F:M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z','K:M10.5 7h3v10h-3z'],
  dice:['M4 4h16v16H4z','F:M8 7a1.5 1.5 0 1 0 0 3a1.5 1.5 0 1 0 0-3zM16 14a1.5 1.5 0 1 0 0 3a1.5 1.5 0 1 0 0-3zM12 10.5a1.5 1.5 0 1 0 0 3a1.5 1.5 0 1 0 0-3z'],
  note:['M9 18V5l11-2v13','F:M6 15.5a3 3 0 1 0 0 6a3 3 0 1 0 0-6zM17 13.5a3 3 0 1 0 0 6a3 3 0 1 0 0-6z'],
  paw:['F:M12 12.5c-3 0-6 3.5-6 6.2 0 1.6 1.2 2.6 2.8 2.6 1.3 0 2.1-.8 3.2-.8s1.9.8 3.2.8c1.6 0 2.8-1 2.8-2.6 0-2.7-3-6.2-6-6.2z','F:M5 7.5a2 2.5 0 1 0 4 0a2 2.5 0 1 0-4 0zM10 4.5a2 2.5 0 1 0 4 0a2 2.5 0 1 0-4 0zM15 7.5a2 2.5 0 1 0 4 0a2 2.5 0 1 0-4 0zM2 12a1.8 2.2 0 1 0 3.6 0a1.8 2.2 0 1 0-3.6 0zM18.4 12a1.8 2.2 0 1 0 3.6 0a1.8 2.2 0 1 0-3.6 0z'],
  fist:['F:M6 9.5c0-1.4 1-2.5 2.3-2.5h8.4c1.8 0 3.3 1.5 3.3 3.3v4.2c0 3.3-2.7 6-6 6h-2C8.7 20.5 6 17.8 6 14.5z','K:M9.5 7h.9v4.5h-.9zM12.6 7h.9v4.5h-.9zM15.7 7h.9v4.5h-.9z','F:M3.5 11.5h3v4h-3z'],
  hammer:['M4 20l9-9','F:M11 4l6-1 4 4-1 6-3-3-3 3-4-4 3-3z'],
};
function icon(name,cls){const P=ICON[name];if(!P)return'';let s=`<svg class="icn${cls?' '+cls:''}" viewBox="0 0 24 24" aria-hidden="true">`;
  for(const p of P){if(p.startsWith('F:'))s+=`<path d="${p.slice(2)}" fill="currentColor"/>`;else if(p.startsWith('K:'))s+=`<path d="${p.slice(2)}" fill="#1a0d04"/>`;else s+=`<path d="${p}" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`}
  return s+'</svg>'}
const P2D={};
function drawIcon(name,x,y,size,col){const P=ICON[name];if(!P||typeof Path2D==='undefined'||!ctx)return false;const k=size/24;ctx.save();ctx.translate(x-size/2,y-size/2);ctx.scale(k,k);ctx.lineWidth=2.2;ctx.lineCap='round';ctx.lineJoin='round';
  for(const p of P){const d=p.startsWith('F:')||p.startsWith('K:')?p.slice(2):p,path=P2D[d]||(P2D[d]=new Path2D(d));if(p.startsWith('F:')){ctx.fillStyle=col;ctx.fill(path)}else if(p.startsWith('K:')){ctx.fillStyle='#1a0d04';ctx.fill(path)}else{ctx.strokeStyle=col;ctx.stroke(path)}}
  ctx.restore();return true}
// data entries keep their old glyph in .glyph and get an SVG in .ic and an icon name in .icn
function applyIcons(){const set=(o,n)=>{if(!o)return;o.glyph=o.glyph||o.ic;o.icn=n;o.ic=icon(n)};
  const TR={kingdom:'crown',wildwood:'leaf',shadow:'moon',plague:'bio',guardian:'shield',marksman:'arrow',sorcerer:'star',assassin:'daggers',beast:'paw',bruiser:'fist'};for(const k in TR)set(TRAITS[k],TR[k]);
  const IT={sword:'sword',bow:'bow',rod:'rod',tear:'drop',cloak:'moon',belt:'heart'};for(const k in IT)set(ITEMS[k],IT[k]);
  for(const k in ITEMS){const I=ITEMS[k];if(I.c){I.glyph=ITEMS[I.c[0]].glyph+ITEMS[I.c[1]].glyph;I.ic=ITEMS[I.c[0]].ic+ITEMS[I.c[1]].ic}}
  const ND={battle:'swords',elite:'skull',event:'question',rest:'fire',merchant:'scales',treasure:'chest',boss:'crown'};for(const k in ND)set(NODES[k],ND[k]);
  for(const k in POTIONS)set(POTIONS[k],'flask');
  const GD={archers:'bow',banner:'flag',priestess:'cross',trebuchet:'boulder',sentinel:'shield',oracle:'rune',reaper:'scythe',dragon:'flame',chrono:'hourglass'};for(const k in GD)set(GUARDS[k],GD[k]);
  const EV={beastmaster:'paw',surveyor:'flag',sealedgate:'rune',moonshrine:'moon',armory:'swords',well:'drop',gambler:'dice',pilgrim:'rune',drill:'flag',altar:'cross',bard:'note',fey:'leaf',hoard:'chest',library:'eye',smithy:'hammer',mirror:'moon',merchant2:'scales'};
  if(typeof EVENTS!=='undefined')for(const k in EVENTS)if(EV[k]){EVENTS[k].ic=icon(EV[k])}}
