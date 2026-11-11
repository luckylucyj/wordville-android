/* Real note/status charts, no inferred improvement metrics or synthetic history. */
(() => {
 'use strict';
 const $=id=>document.getElementById(id);
 const N=globalThis.WordvilleNoteModel;
 function item(tag,cls,label){
  const el=document.createElement(tag);
  if(cls)el.className=cls;
  if(label!==undefined)el.textContent=label;
  return el;
 }
 function scopeEntries(day){
  const all=[];
  if(typeof words==='undefined')return all;
  for(const w of words){
   const days=(w.days||[]).filter(N.validDay).map(Number);
   if(!days.length)days.push(0);
   for(const d of days){
    if(day!=='all'&&d!==Number(day))continue;
    all.push(globalThis.WordvilleStudy.get(w,d));
   }
  }
  return all;
 }
 function renderDistribution(day){
  const container=$('wv-status-summary-graph');if(!container)return;
  container.replaceChildren();
  const stats=N.distribution(scopeEntries(day));
  const caption=item('p','wv-graph-caption','전체 '+stats.total+'개 기록 단위 · 직접 체크 '+stats.marked+'개 · 미기록 '+stats.unmarked+'개');
  container.append(caption);
  for(const s of N.STATUSES){
   const count=stats.counts[s.id],row=item('div','wv-distribution-row');
   const name=item('span','wv-bar-name');
   name.append(item('b','wv-code-chip wv-status-'+(s.id==='✓'?'ok':s.id),s.id),item('span','',s.label));
   const track=item('div','wv-distribution-track');
   const bar=item('span','wv-distribution-fill wv-status-'+(s.id==='✓'?'ok':s.id));
   bar.style.width=(stats.marked?count/stats.marked*100:0)+'%';
   track.append(bar);
   const num=item('strong','wv-bar-count',String(count));
   row.append(name,track,num);container.append(row);
  }
  const help=item('p','wv-graph-foot','색 막대 길이: 상태 체크한 단어 중 해당 상태의 비중. 미기록은 막대 비율에서 제외합니다.');
  container.append(help);
 }
 function renderTrend(day){
  const holder=$('wv-status-trend-graph'),legend=$('wv-status-legend');if(!holder||!legend)return;
  holder.replaceChildren();legend.replaceChildren();
  const events=(globalThis.WordvilleStudy?.events||[]).filter(e=>
   (day==='all'||e.day===Number(day))&&N.STATUS_IDS.has(e.to)&&e.occurredAt);
  const groups=new Map();
  for(const e of events){
   const key=e.occurredAt.slice(0,10);
   if(!groups.has(key))groups.set(key,Object.fromEntries(N.STATUSES.map(s=>[s.id,0])));
   groups.get(key)[e.to]++;
  }
  const days=[...groups.keys()].sort().slice(-14);
  if(!days.length){holder.append(item('p','wv-empty-trend','아직 기록된 상태 체크가 없습니다. 단어 상태를 저장하면 날짜별 변화가 표시됩니다.'));return;}
  const max=Math.max(1,...days.map(d=>Object.values(groups.get(d)).reduce((a,b)=>a+b,0)));
  const graph=item('div','wv-trend-bars');graph.setAttribute('role','img');
  graph.setAttribute('aria-label','최근 상태 기록이 발생한 '+days.length+'일의 날짜별 체크 횟수, 상태별 색상');
  for(const d of days){
   const counts=groups.get(d),total=Object.values(counts).reduce((a,b)=>a+b,0);
   const col=item('div','wv-trend-column');
   const stack=item('div','wv-trend-stack');
   stack.style.height=Math.max(4,total/max*125)+'px';
   for(const s of N.STATUSES){
    const amount=counts[s.id];if(!amount)continue;
    const segment=item('div','wv-trend-segment wv-status-'+(s.id==='✓'?'ok':s.id));
    segment.style.height=(100*amount/total)+'%';
    segment.title=N.statusName(s.id)+' '+amount+'건';
    stack.append(segment);
   }
   const date=item('span','wv-trend-date',d.slice(5).replace('-','/'));
   col.title=d+' · 기록 '+total+'건';
   col.append(item('b','wv-trend-count',String(total)),stack,date);
   graph.append(col);
  }
  holder.append(graph);
  for(const s of N.STATUSES){const p=item('span','wv-chart-key');p.append(item('b','wv-code-chip wv-status-'+(s.id==='✓'?'ok':s.id),s.id),document.createTextNode(s.label));legend.append(p);}
 }
 function render(day){if(!globalThis.WordvilleStudy)return;renderDistribution(day);renderTrend(day);}
 globalThis.WordvilleStatusCharts={render};
})();
