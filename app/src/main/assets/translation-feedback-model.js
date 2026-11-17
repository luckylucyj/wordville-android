(function(root){
'use strict';
const languages=['en','ja','zh','es','fr','de'];
const maxLength=1600,maxSegments=8;
const enRules=[
 ['강조와 시간','not until',/\bnot until\b|\b(?:did|does|do|was|were)n['’]t\b[^.!?]{0,90}\buntil\b/i,/비로소|(?:고|서|에야)|까지.{0,16}(?:않|못)/,
  'until 뒤에 나온 때가 되기 전에는 일이 일어나지 않았다는 뜻이에요. 그때 시작했다는 의미를 “~하고 나서야”로 나타낼 수 있어요.'],
 ['예외 조건','unless',/\bunless\b/i,/않으면|없으면|하지 않는 한|아니면|않을 경우|때만|경우에만|아닌 한|빼고|제외/,
  'unless 뒤에는 예외가 와요. 기본 경우와 예외를 나눠 보고, “~하지 않는 한”이나 “~일 때만”으로 옮겨 보세요.'],
 ['양보','although / even though',/\b(?:although|even though|though)\b/i,/지만|는데도|에도|하더라도|일지라도|그래도|그러나|그럼에도|와 달리/,
  '앞의 내용은 사실로 인정하고, 뒤에는 그 사실과 예상이 다른 결과가 와요. 원인으로 연결하면 뜻이 달라져요. “~했지만”이나 “~했는데도”로 옮겨 보세요.'],
 ['가정과 양보','even if',/\beven if\b/i,/더라도|설령|일지라도|해도|어도|아도/,
  'even if 뒤는 사실로 확인된 일이 아닌 가정이에요. “설령 ~해도”로 옮기면 조건이 성립해도 결과는 그대로라는 뜻이 살아나요.'],
 ['의무의 부정','do not have to',/\b(?:(?:does|do|did) not|(?:does|do|did)n['’]t) have to\b/i,/필요.{0,5}없|안 해도|안 내도|안 와도|지 않아도|지 않아도 된|하지 않아도|의무.{0,5}없/,
  '필요나 의무가 없다는 뜻이에요. “~하면 안 된다”는 금지이므로, “~하지 않아도 된다”로 옮겨 보세요.'],
 ['금지','must not',/\b(?:must not|mustn['’]t)\b/i,/하면 안|해서는 안|하지 말|금지|지 않으면 안/,
  'must not 뒤의 행동을 하면 안 된다는 뜻이에요. “할 필요가 없다”와 뜻이 달라요.'],
 ['범위가 제한된 부정','not necessarily',/\bnot necessarily\b/i,/반드시.{0,28}(?:아니|않)|꼭.{0,28}(?:아니|않)|항상.{0,28}(?:아니|않)|단정/,
  '가능성을 완전히 부정하는 표현보다 약해요. “반드시 ~인 것은 아니다”처럼 옮겨 보세요.'],
 ['추측과 과거','must have',/\bmust have\s+(?:been|had|done|gone|seen|said|left|met|paid|taken|made|[a-z]+ed)\b/i,/틀림없|분명|했겠|했을 것|였을 것|었겠|일 것/,
  '이미 일어난 일을 근거로 강하게 추측하는 표현이에요. “틀림없이 ~했을 것이다”처럼 과거와 추측을 모두 살려 보세요.'],
 ['과거에 대한 아쉬움','should have',/\bshould(?: not)? have\s+(?:been|had|done|gone|seen|said|left|met|paid|taken|made|[a-z]+ed)\b/i,/했어야|았어야|었어야|말았어야|하는 게 나았/,
  '이미 지나간 행동에 대해 “~했어야 했다”라고 말하는 표현이에요. should not이 있으면 “~하지 말았어야 했다”로 방향이 바뀌어요.'],
 ['과거보다 앞선 일','had + 과거분사',/\bhad(?: already| just| previously)?\s+(?:been|had|done|gone|seen|said|left|met|paid|taken|made|[a-z]+ed)\b/i,/이미|먼저|해 둔|해 놓|했던|했었|전에|한 뒤|해 둬/,
  '과거의 기준 시점보다 먼저 끝난 일인지 확인하세요. “이미 ~한 뒤였다”나 “그 전에 ~했다”로 순서를 보여줄 수 있어요.'],
 ['가능성과 의무','may / might',/\b(?:may|might)\s+(?:be|have|need|want|take|happen|decide|apply|go|miss|rain)\b/i,/수도|수 있|지도|가능|아마|일까|허용/,
  '문맥에 따라 가능성이나 허용을 나타내요. 사실이 확정된 것처럼 옮겼다면 “~일 수 있다” 또는 “~해도 된다” 중 문맥에 맞는 표현을 고르세요.'],
 ['비교 범위','at least / at most',/\bat (?:least|most)\b/i,/적어도|최소|최대|많아야|이상|이하|기껏해야/,
  'at least는 그 수를 포함한 최소 기준, at most는 그 수를 포함한 최대 기준이에요. 숫자와 방향을 함께 확인하세요.'],
 ['완료 시한과 지속','by / until',/\b(?:by|until)\s+(?:\d{1,2}(?::\d{2})?|tomorrow|today|then|(?:mon|tues|wednes|thurs|fri|satur|sun)day|next week)\b/i,/까지|이내|전에|전까지/,
  'by는 완료 시한을, until은 행동이 이어지는 마지막 시점을 나타내요. 끝내야 하는 시간인지 계속하는 시간인지 확인하세요.'],
 ['과거와 현재의 차이','used to',/\b(?:i|we|you|he|she|they|it) used to\s+(?!be used\b)[a-z]+\b/i,/예전|과거|곤 했|하던|한 적|한때|전에는/,
  '과거의 습관이나 상태를 말하며 지금은 달라졌을 수 있어요. “예전에는 ~하곤 했다”처럼 옮겨 보세요.'],
 ['시간 표현','no longer',/\bno longer\b/i,/더는|더 이상|이제.{0,12}(?:않|아니|못)/,
  '전에는 성립했지만 이제는 더 이상 성립하지 않는다는 뜻이에요. “이제는 ~하지 않는다”로 옮겨 보세요.'],
 ['부정의 범위','not all / not every',/\bnot (?:all|every)\b/i,/모두.{0,18}(?:아니|않)|전부.{0,18}(?:아니|않)|다.{0,17}(?:아니|않)|일부|모든.{0,18}(?:아니|않)/,
  '전체를 부정하는 대신 일부는 해당하지 않는다는 뜻이에요. “모두가 ~인 것은 아니다”로 옮겨 보세요.'],
 ['역할과 행동','be + 과거분사',/\b(?:is|are|was|were|been) (?:reviewed|sent|delivered|approved|canceled|cancelled|paid|made|written|taken|selected|dismissed|closed|completed|reported|announced)\b/i,
  /(?:에 의해|에게서|받았|되었|됐다|된|됩니다)/,
  '원문의 주어는 행동을 한 쪽인지, 행동을 받은 쪽인지 확인하세요. 한국어에서 능동 표현으로 바꿔도 두 역할은 그대로 유지할 수 있어요.'],
 ['정해진 계획','be supposed to',/\b(?:am|is|are|was|were) supposed to\b/i,/하기로|예정|해야|정해져/,
  '정해진 계획이나 기대를 나타내요. 이미 일어난 일처럼 옮기지 말고 “~하기로 되어 있다”라는 뜻을 살려 보세요.'],
 ['결국 벌어진 일','end up',/\b(?:end|ends|ended|ending) up\b/i,/결국|끝내|결과적으로|하게 됐|하게 되었/,
  '앞선 상황 끝에 실제로 벌어진 결과예요. “결국 ~하게 됐다”로 옮기면 의도와 결과를 구분하기 쉬워요.'],
 ['연기와 취소','put off',/\b(?:put|puts|putting) off\b/i,/미루|미뤄|미뤘|연기|늦추|뒤로/,
  '일정이나 일을 나중으로 미룬다는 뜻일 수 있어요. 취소인지 연기인지는 원문의 목적어와 문맥을 확인하세요.'],
 ['거의 없는 정도','hardly',/\bhardly\b/i,/거의.{0,18}(?:않|못|없)|간신히|좀처럼|거의 안/,
  'hardly는 “거의 ~하지 않다”라는 부정에 가까운 표현이에요. hard의 “열심히”와 의미가 달라요.'],
 ['부정 표현','not / never',/\bnever\b|\bnot\b(?!\s+(?:only|until|necessarily|all|every)\b)|\b(?:did|does|do|is|are|was|were|will|would|should|can|could|has|have|had)n['’]t\b/i,/않|못|아니|없|금지|말[라고]|말라|결코|하지 마/,
  '부정이 문장 전체에 걸리는지, 동작이나 특정 조건에만 걸리는지 확인하세요. 뜻을 뒤집기 쉬운 부분이에요.']
];
const others={
 ja:[
  ['양보','〜のに / 〜にもかかわらず',/のに|にもかかわらず/,/지만|는데도|에도|그러나|그럼에도/,'앞 상황에도 불구하고 예상과 다른 일이 일어났는지 확인하세요.'],
  ['조건','〜なら / 〜たら',/なら|たら|ば、/,/라면|하면|으면|다면|경우|때는/,'조건과 그 조건에서의 결과를 따로 구분해 보세요.'],
  ['부정·금지','〜ない / 〜ません',/ない|ません|てはいけない/,/않|못|아니|없|금지|안|하지 마/,'무엇을 하지 않거나 할 수 없다는 뜻인지 확인하세요.'],
  ['의무','〜なければならない',/なければならない|なくてはならない|ないといけない/,/야\s*(?:한|합|하|해|된|됩|되|돼)|의무|필요|하지 않으면 안/,'겉에 부정형이 있어도 전체는 “~해야 한다”는 의무예요.']
 ],
 zh:[
  ['양보','虽然…但是',/虽然|雖然|尽管|儘管/,/지만|는데도|에도|그러나|그럼에도/,'앞 사실을 인정하면서도 뒤에 다른 결과가 나오는 연결인지 확인하세요.'],
  ['조건','如果 / 除非',/如果|假如|除非/,/라면|하면|으면|다면|않는 한|때만|경우/,'如果는 조건, 除非는 예외 조건이에요. 조건이 성립할 때 결과가 어떻게 되는지 살펴보세요.'],
  ['부정 표현','不 / 没有',/没有|沒有|不能|不会|不會|不是|从不|從不/,/않|못|아니|없|안|금지/,'부정이 행동, 가능성, 사실 중 어디에 걸리는지 확인하세요.']
 ],
 es:[
  ['양보','aunque',/\baunque\b/i,/지만|는데도|더라도|에도|그러나/,'앞 사실을 인정하는 “~지만”인지, 가정인 “~더라도”인지 문맥을 확인하세요.'],
  ['부정 표현','no / nunca',/\b(?:no|nunca|jamás)\b/i,/않|못|아니|없|안|결코/,'부정되는 행동이나 조건을 확인하고 해석에도 그 범위를 살려 보세요.']
 ],
 fr:[
  ['양보','bien que / même si',/\bbien qu(?:e|['’])|\bmême si\b/i,/지만|는데도|더라도|에도|그러나/,'앞 사실을 인정하는 표현인지 가정인지 살펴보고 뒤의 결과와 구분해 보세요.'],
  ['부정 표현','ne … pas / jamais / plus',/\b(?:ne\s|n['’])[^.!?]{0,55}\b(?:pas|jamais|plus)\b/i,/않|못|아니|없|안|결코|더 이상/,'pas는 부정, jamais는 “한 번도”, plus는 “더 이상”의 의미를 보탤 수 있어요.']
 ],
 de:[
  ['양보','obwohl / auch wenn',/\bobwohl\b|\bauch wenn\b/i,/지만|는데도|더라도|에도|그러나/,'앞 사실이나 가정과 뒤의 결과가 어떤 관계인지 확인하세요.'],
  ['부정 표현','nicht / kein',/\b(?:nicht|kein(?:e|en|em|er|es)?|niemals)\b/i,/않|못|아니|없|안|결코/,'무엇이 없다는 것인지, 행동이나 특정 부분을 부정하는 것인지 확인하세요.']
 ]
};

function split(text,locale){
 const result=[];
 for(const paragraph of text.trim().split(/\n+/)){
  const line=paragraph.trim();
  if(!line)continue;
  const parts=typeof Intl.Segmenter==='function'
   ?Array.from(new Intl.Segmenter(locale,{granularity:'sentence'}).segment(line),part=>part.segment.trim())
   :line.match(/[^.!?。！？]+(?:[.!?。！？]+|$)/g)?.map(part=>part.trim());
  result.push(...(parts?.filter(Boolean).length?parts.filter(Boolean):[line]));
 }
 return result;
}

function align(source,attempt,locale){
 const originals=split(source,locale),drafts=split(attempt,'ko');
 if(originals.length===drafts.length&&originals.length<=maxSegments){
  return {combined:false,pairs:originals.map((original,index)=>({original,draft:drafts[index]}))};
 }
 return {combined:originals.length!==drafts.length||originals.length>maxSegments,
  pairs:[{original:source.trim(),draft:attempt.trim()}]};
}

function numberTokens(text){
 return [...new Set((text.normalize('NFKC').match(/\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:[.,]\d+)?/g)||[])
  .map(token=>token.replace(/,(?=\d{3}(?:,|\.|$))/g,'').replace(',','.')))];
}

function checkpoints(source,draft,locale){
 const rules=locale==='en'?enRules:(others[locale]||[]);
 const issues=[];
 for(const [title,expression,pattern,korean,guide] of rules){
  const hit=source.match(pattern);
  if(!hit)continue;
  if(locale==='ja'&&title==='부정·금지'&&/なければならない|なくてはならない|ないといけない/.test(source)&&!/ません|てはいけない/.test(source))continue;
  if(title==='부정 표현'&&issues.some(item=>['의무의 부정','금지','강조와 시간'].includes(item.title)))continue;
  let found=korean.test(draft);
  if(title==='비교 범위'){
   const minimum=/least/i.test(hit[0]);
   found=minimum?/적어도|최소|이상/.test(draft):/많아야|최대|이하|기껏해야/.test(draft);
  }
  issues.push({title,expression,source:hit[0],guide,found});
 }
 const numbers=numberTokens(source),translated=numberTokens(draft);
 const missing=numbers.filter(number=>!translated.includes(number));
 if(missing.length)issues.push({
  title:'숫자·시간', expression:missing.join(', '), source:missing.join(', '),found:false,
  guide:'원문에 있는 숫자가 해석에서 같은 값으로 읽히는지 확인하세요. 한글 수 표현이나 단위 변환으로 옮겼다면 두 값이 같은지 확인하면 돼요.'
 });
 return issues;
}

const ignoredTerms=new Set(['있습니다','없습니다','있었다','것이다','것입니다','것으로','그것을','그들은','그녀는','있다는','한다는','합니다','됩니다','때문에','하지만','그래서','그런데','그리고','이러한','이것은','그것은']);
function koreanTerms(text){
 return [...new Set((text.match(/[가-힣]{3,}/g)||[]).filter(word=>!ignoredTerms.has(word))
  .map(word=>word.replace(/(?:에서는|으로는|으로도|에서|에게|까지|부터|처럼|으로|지만|하고|들이|들을|에게는|은|는|이|가|을|를|의|에|도|와|과)$/u, ''))
  .filter(word=>word.length>=2&&!ignoredTerms.has(word)))];
}

function compareReference(reference,draft){
 const terms=koreanTerms(draft);
 return koreanTerms(reference).filter(term=>!terms.some(other=>term.startsWith(other)||other.startsWith(term)||term.slice(0,3)===other.slice(0,3))).slice(0,4);
}
root.WordvilleInterpretationModel={languages,maxLength,maxSegments,split,align,checkpoints,compareReference};
})(globalThis);
